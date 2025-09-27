import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { useGraphQLMutation } from "../../hooks/useTanStackQuery";
import { DialogPanel, Fieldset, Dialog } from "@headlessui/react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";

import {
  Input,
  Header,
  FormField,
  Textarea,
  Button,
} from "@cloudscape-design/components";

type CreateJobInputs = {
  name: string;
  description: string;
};

interface ICreateJobDialog {
  dialogOpen: boolean;
  setDialogOpen: Dispatch<SetStateAction<boolean>>;
}

export const CreateJobDialog = ({
  dialogOpen,
  setDialogOpen,
}: ICreateJobDialog) => {
  const navigate = useNavigate();

  const { control, handleSubmit } = useForm<CreateJobInputs>();

  const createJobMutation = useGraphQLMutation("createJob");

  const onSubmit: SubmitHandler<CreateJobInputs> = async (data) => {
    const { name, description } = data;

    try {
      const { createJob } = await createJobMutation.mutateAsync({
        input: { name, description },
      });
      navigate(`/job/${createJob?.jobId}`);
      toast.success("Successfully created job!");
    } catch (error) {
      return toast.error(JSON.stringify(error, null, 2));
    }
  };

  return (
    <Dialog
      open={dialogOpen}
      onClose={() => {
        if (!createJobMutation.isPending) setDialogOpen(false);
      }}
    >
      <div className="fixed inset-0 z-10">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel
            transition
            className="w-full max-w-md rounded-xl bg-white/5 p-6 backdrop-blur-2xl duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
          >
            <Header
              className="pb-2"
              actions={
                <Button
                  onClick={() => setDialogOpen(false)}
                  iconName="close"
                  variant="icon"
                />
              }
            >
              Create job
            </Header>

            <form onSubmit={handleSubmit(onSubmit)}>
              <Fieldset className="space-y-6 rounded-xl sm:p-3">
                <Controller
                  name="name"
                  rules={{ required: true }}
                  render={({ field, fieldState }) => (
                    <FormField
                      label="Job Name"
                      errorText={fieldState.error?.type}
                    >
                      <Input
                        {...field}
                        onChange={({ detail }) => field.onChange(detail.value)}
                        disabled={createJobMutation.isPending}
                      />
                    </FormField>
                  )}
                  control={control}
                />

                <Controller
                  name="description"
                  render={({ field, fieldState }) => (
                    <FormField
                      description="Provide a short description"
                      label={
                        <span>
                          Description <i>- optional</i>{" "}
                        </span>
                      }
                      errorText={fieldState.error?.type}
                    >
                      <Textarea
                        {...field}
                        onChange={({ detail }) => field.onChange(detail.value)}
                        placeholder="This job is about..."
                        disabled={createJobMutation.isPending}
                      />
                    </FormField>
                  )}
                  control={control}
                />
              </Fieldset>

              <div className="p-3 float-right">
                <Button
                  loading={createJobMutation.isPending}
                  className="rounded-md! px-3! py-1.5!"
                >
                  Creat{createJobMutation.isPending ? "ing" : "e"}
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};
