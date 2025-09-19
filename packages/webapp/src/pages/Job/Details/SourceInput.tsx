import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { useGraphQLMutation } from "../../../hooks/useTanStackQuery";
import type { UseQueryResult } from "@tanstack/react-query";
import { useListS3Mutation } from "../../../hooks/useApi";
import type { GetJobQuery } from "../../../API";
import { useParams } from "react-router";
import toast from "react-hot-toast";
import { useState } from "react";

import {
  Button,
  FormField,
  Input,
  S3ResourceSelector,
  SpaceBetween,
} from "@cloudscape-design/components";

type SourceInput = {
  s3Uri: string;
};

interface ISourceInput {
  getJobQuery: UseQueryResult<GetJobQuery, Error>;
}

export const SourceInput = ({ getJobQuery }: ISourceInput) => {
  const { jobId } = useParams();

  const { handleSubmit, control } = useForm<SourceInput>();
  const updateJobMutation = useGraphQLMutation("updateJob");
  const listS3Mutation = useListS3Mutation();

  const [edit, setEdit] = useState(false);

  const onSubmit: SubmitHandler<SourceInput> = async (data) => {
    const { s3Uri } = data;
    try {
      await updateJobMutation.mutateAsync({
        input: { jobId, s3Uri },
      });
      setEdit(false);
      getJobQuery.refetch();
      return toast.success("Source Location updated!");
    } catch (error) {
      return toast.error(JSON.stringify(error, null, 2));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="s3Uri"
        defaultValue={getJobQuery.data?.getJob?.s3Uri ?? undefined}
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <FormField errorText={fieldState.error?.type} stretch>
            {edit ? (
              <SpaceBetween size="l">
                <S3ResourceSelector
                  {...field}
                  invalid={fieldState.invalid}
                  onChange={({ detail }) => {
                    field.onChange(detail.resource.uri);
                  }}
                  resource={{ uri: field.value }}
                  objectsIsItemDisabled={(item) => Boolean(!item.IsFolder)}
                  fetchBuckets={() =>
                    Promise.resolve([
                      {
                        Name: import.meta.env.VITE_UISTORAGEBUCKET,
                      },
                    ])
                  }
                  fetchObjects={async (_, pathPrefix) => {
                    const directories = [];
                    const content = await listS3Mutation.mutateAsync(
                      pathPrefix
                    );

                    if (content.excludedSubpaths) {
                      for (const folder of content.excludedSubpaths) {
                        directories.push({
                          Key: folder.split("/").slice(-2).join("/"),
                          IsFolder: true,
                        });
                      }
                    }

                    if (content.items) {
                      for (const item of content.items) {
                        directories.push({
                          Key: item.path.split("/").pop(),
                          LastModified: item.lastModified?.toString(),
                          Size: item.size,
                          IsFolder: false,
                        });
                      }
                    }

                    return directories;
                  }}
                  fetchVersions={() => Promise.resolve([])}
                  selectableItemsTypes={["objects"]}
                  viewHref={
                    field.value &&
                    `https://${
                      import.meta.env.VITE_REGION
                    }.console.aws.amazon.com/s3/buckets/${
                      import.meta.env.VITE_UISTORAGEBUCKET
                    }?prefix=${field.value.split("/").slice(3).join("/")}`
                  }
                />
                <SpaceBetween size="xs" direction="horizontal">
                  <Button
                    formAction="submit"
                    iconName="close"
                    variant="inline-icon"
                    disabled={updateJobMutation.isPending}
                    onClick={(e) => {
                      e.preventDefault();
                      setEdit(false);
                    }}
                  />
                  <Button
                    formAction="submit"
                    iconName="check"
                    variant="inline-icon"
                    loading={updateJobMutation.isPending}
                  />
                </SpaceBetween>
              </SpaceBetween>
            ) : (
              <div className="flex gap-3">
                <Input
                  {...field}
                  disabled={true}
                  className="flex-1"
                  invalid={fieldState.invalid || !field.value}
                />
                <Button
                  iconName="edit"
                  variant="inline-icon"
                  onClick={(e) => {
                    e.preventDefault();
                    setEdit(true);
                  }}
                />
              </div>
            )}
          </FormField>
        )}
        control={control}
      />
    </form>
  );
};
