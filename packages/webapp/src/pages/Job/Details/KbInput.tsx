import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import {
  useGraphQLMutation,
  useGraphQLQuery,
} from "../../../hooks/useTanStackQuery";
import type { UseQueryResult } from "@tanstack/react-query";
import type { GetJobQuery } from "../../../API";
import { useParams } from "react-router";
import toast from "react-hot-toast";
import { useState } from "react";

import {
  Button,
  FormField,
  Select,
  SpaceBetween,
  type SelectProps,
} from "@cloudscape-design/components";

type NameInput = {
  kb: SelectProps.Option;
};

interface INameInput {
  getJobQuery: UseQueryResult<GetJobQuery, Error>;
}

export const KbInput = ({ getJobQuery }: INameInput) => {
  const { jobId } = useParams();

  const { handleSubmit, control } = useForm<NameInput>();
  const updateJobMutation = useGraphQLMutation("updateJob");
  const listKnowledgeBases = useGraphQLQuery("listKnowledgeBases");

  const [edit, setEdit] = useState(false);

  const onSubmit: SubmitHandler<NameInput> = async (data) => {
    const { kb } = data;
    try {
      await updateJobMutation.mutateAsync({
        input: {
          jobId,
          kb,
        },
      });
      setEdit(false);
      getJobQuery.refetch();
      return toast.success("Knowledge Base updated!");
    } catch (error) {
      return toast.error(JSON.stringify(error, null, 2));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="kb"
        defaultValue={getJobQuery.data?.getJob?.kb ?? {}}
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <FormField errorText={fieldState.error?.type} stretch>
            <div className="flex gap-3 items-center">
              <Select
                {...field}
                invalid={
                  fieldState.invalid ||
                  !field.value ||
                  JSON.stringify(field.value) === "{}"
                }
                disabled={!edit || updateJobMutation.isPending}
                selectedOption={field.value}
                onChange={({ detail }) => field.onChange(detail.selectedOption)}
                options={listKnowledgeBases.data?.listKnowledgeBases?.knowledgeBaseSummaries?.map(
                  (kb) => {
                    return { label: kb.name!, value: kb.knowledgeBaseId! };
                  }
                )}
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
