import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import {
  Modal,
  FormField,
  Input,
  Button,
  Box,
} from "@cloudscape-design/components";
import { type Dispatch, type SetStateAction } from "react";
import { useUploadS3Data } from "../../../hooks/useApi";
import { useParams } from "react-router";
import toast from "react-hot-toast";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ListPaginateWithPathOutput } from "aws-amplify/storage";

type NewFileInput = {
  fileName: string;
};

interface INewFile {
  newFile: boolean;
  setNewFile: Dispatch<SetStateAction<boolean>>;
  listS3: UseQueryResult<ListPaginateWithPathOutput, Error>;
}

export const NewFile = ({ newFile, setNewFile, listS3 }: INewFile) => {
  const { jobId } = useParams();

  const { handleSubmit, control } = useForm<NewFileInput>();

  const uploadS3Data = useUploadS3Data();

  const onSubmit: SubmitHandler<NewFileInput> = async (data) => {
    const { fileName } = data;

    try {
      await uploadS3Data.mutateAsync({
        data: null,
        path: `jobs/${jobId}/code/${fileName}`,
      });
      toast.success("File created!");
      setNewFile(false);
      listS3.refetch();
    } catch (error) {
      return toast.error(JSON.stringify(error, null, 2));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Modal
        onDismiss={() => {
          if (!uploadS3Data.isPending) setNewFile(false);
        }}
        visible={newFile}
        footer={
          <Box float="right">
            <Button
              loading={uploadS3Data.isPending}
              onClick={() => {
                handleSubmit(onSubmit)();
              }}
            >
              Create
            </Button>
          </Box>
        }
        header="New File"
      >
        <Controller
          name="fileName"
          rules={{ required: true }}
          render={({ field, fieldState }) => (
            <FormField
              description="Must end in .py"
              errorText={fieldState.error?.type}
              label="File Name"
              stretch
            >
              <Input
                {...field}
                disabled={uploadS3Data.isPending}
                onChange={({ detail }) => field.onChange(detail.value)}
              />
            </FormField>
          )}
          control={control}
        />
      </Modal>
    </form>
  );
};
