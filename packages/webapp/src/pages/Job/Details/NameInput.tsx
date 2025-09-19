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
  Input,
  SpaceBetween,
} from "@cloudscape-design/components";

type NameInput = {
  name: string;
};

interface INameInput {
  getJobQuery: UseQueryResult<GetJobQuery, Error>;
}

export const NameInput = ({ getJobQuery }: INameInput) => {
  const { jobId } = useParams();

  const { handleSubmit, control } = useForm<NameInput>();
  const updateJobMutation = useGraphQLMutation("updateJob");

  const [edit, setEdit] = useState(false);

  const onSubmit: SubmitHandler<NameInput> = async (data) => {
    const { name } = data;
    try {
      await updateJobMutation.mutateAsync({
        input: {
          jobId,
          name,
        },
      });
      setEdit(false);
      getJobQuery.refetch();
      return toast.success("Name updated!");
    } catch (error) {
      return toast.error(JSON.stringify(error, null, 2));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="name"
        defaultValue={getJobQuery.data?.getJob?.name ?? ""}
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <FormField errorText={fieldState.error?.type} stretch>
            <div className="flex gap-3 items-center">
              <Input
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
