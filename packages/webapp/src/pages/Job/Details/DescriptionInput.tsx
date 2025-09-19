import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { useGraphQLMutation } from "../../../hooks/useTanStackQuery";
import type { UseQueryResult } from "@tanstack/react-query";
import type { GetJobQuery } from "../../../API";
import { useParams } from "react-router";
import toast from "react-hot-toast";
import { useState } from "react";

import {
  Button,
  FormField,
  SpaceBetween,
  Textarea,
} from "@cloudscape-design/components";

type DescriptionInput = {
  description: string;
};

interface IDescriptionInput {
  getJobQuery: UseQueryResult<GetJobQuery, Error>;
}

export const DescriptionInput = ({ getJobQuery }: IDescriptionInput) => {
  const { jobId } = useParams();

  const { handleSubmit, control } = useForm<DescriptionInput>();
  const updateJobMutation = useGraphQLMutation("updateJob");

  const [edit, setEdit] = useState(false);

  const onSubmit: SubmitHandler<DescriptionInput> = async (data) => {
    const { description } = data;
    try {
      await updateJobMutation.mutateAsync({
        input: {
          jobId,
          description,
        },
      });
      setEdit(false);
      getJobQuery.refetch();
      return toast.success("Description updated!");
    } catch (error) {
      return toast.error(JSON.stringify(error, null, 2));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="description"
        defaultValue={getJobQuery.data?.getJob?.description ?? ""}
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <FormField errorText={fieldState.error?.type} stretch>
            <div className="flex gap-3 items-center">
              <Textarea
                {...field}
                disabled={!edit || updateJobMutation.isPending}
                onChange={({ detail }) => field.onChange(detail.value)}
                className="grow!"
              />
              {edit ? (
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
              ) : (
                <Button
                  iconName="edit"
                  variant="inline-icon"
                  onClick={(e) => {
                    e.preventDefault();
                    setEdit(true);
                  }}
                />
              )}
            </div>
          </FormField>
        )}
        control={control}
      />
    </form>
  );
};
