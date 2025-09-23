import {
  Controller,
  useFieldArray,
  useForm,
  type SubmitHandler,
} from "react-hook-form";
import { useParams } from "react-router";
import { useUploadS3Data } from "../../../hooks/useApi";
import {
  Box,
  Button,
  FormField,
  Textarea,
  SpaceBetween,
  ExpandableSection,
  Header,
  Table,
  Input,
} from "@cloudscape-design/components";
import toast from "react-hot-toast";
import { useGraphQLMutation } from "../../../hooks/useTanStackQuery";

interface WorkflowFormInput {
  agents: { systemPrompt: string }[];
  rowCategories: { name: string; description: string }[];
  columnCategories: { name: string; description: string }[];
}

export const WorkflowForm = () => {
  const { jobId } = useParams();
  const createWorkflow = useGraphQLMutation("createWorkflow");

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<WorkflowFormInput>({
    defaultValues: {
      agents: [],
      rowCategories: [],
      columnCategories: [],
    },
  });

  const agents = useFieldArray({
    control,
    name: "agents",
  });

  const rowCategories = useFieldArray({
    control,
    name: "rowCategories",
  });

  const columnCategories = useFieldArray({
    control,
    name: "columnCategories",
  });

  const onSubmit: SubmitHandler<WorkflowFormInput> = async (data) => {
    try {
      window.alert(JSON.stringify({ data }, null, 2));
      await createWorkflow.mutateAsync({ input: { ...data, jobId } });
      toast.success("Workflow created successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create workflow");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SpaceBetween size="l">
        {/* Dynamic Agent Sections */}
        {agents.fields.map((agent, index) => (
          <ExpandableSection
            key={agent.id}
            headerText={`Agent ${index + 1}`}
            headerActions={
              <Button
                variant="icon"
                iconName="close"
                onClick={() => agents.remove(index)}
              />
            }
          >
            <Controller
              name={`agents.${index}.systemPrompt`}
              control={control}
              render={({ field }) => (
                <FormField
                  label="Agent Responsibilities"
                  description={`Define what agent should do in this workflow`}
                >
                  <Textarea
                    {...field}
                    onChange={({ detail }) => field.onChange(detail.value)}
                    name={`agents.${index}.systemPrompt`}
                    placeholder={`Describe agent's role and responsibilities...`}
                    rows={4}
                  />
                </FormField>
              )}
            />
          </ExpandableSection>
        ))}
        <Button
          formAction="none"
          onClick={() => agents.append({ systemPrompt: "" })}
          iconName="add-plus"
        >
          Add Agent
        </Button>

        <Header>Assessment Schema</Header>

        <ExpandableSection headerText={`Column Categories`}>
          <SpaceBetween size="l">
            {columnCategories.fields.map((row, index) => (
              <>
                <Controller
                  name={`columnCategories.${index}.name`}
                  control={control}
                  render={({ field }) => (
                    <FormField label={`Column ${index + 1}`}>
                      <Input
                        {...field}
                        onChange={({ detail }) => field.onChange(detail.value)}
                        placeholder={`Name...`}
                      />
                    </FormField>
                  )}
                />
                <Controller
                  name={`columnCategories.${index}.description`}
                  control={control}
                  render={({ field }) => (
                    <FormField>
                      <Textarea
                        {...field}
                        onChange={({ detail }) => field.onChange(detail.value)}
                        placeholder={`Description...`}
                      />
                    </FormField>
                  )}
                />
              </>
            ))}
            <Button
              formAction="none"
              onClick={() =>
                columnCategories.append({ name: "", description: "" })
              }
              iconName="add-plus"
            >
              Add
            </Button>
          </SpaceBetween>
        </ExpandableSection>

        <ExpandableSection headerText={`Row Categories`}>
          <SpaceBetween size="l">
            {rowCategories.fields.map((row, index) => (
              <>
                <Controller
                  name={`rowCategories.${index}.name`}
                  control={control}
                  render={({ field }) => (
                    <FormField label={`Row ${index + 1}`}>
                      <Input
                        {...field}
                        onChange={({ detail }) => field.onChange(detail.value)}
                        placeholder={`Name...`}
                      />
                    </FormField>
                  )}
                />
                <Controller
                  name={`rowCategories.${index}.description`}
                  control={control}
                  render={({ field }) => (
                    <FormField>
                      <Textarea
                        {...field}
                        onChange={({ detail }) => field.onChange(detail.value)}
                        placeholder={`Description...`}
                      />
                    </FormField>
                  )}
                />
              </>
            ))}
            <Button
              formAction="none"
              onClick={() =>
                rowCategories.append({ name: "", description: "" })
              }
              iconName="add-plus"
            >
              Add
            </Button>
          </SpaceBetween>
        </ExpandableSection>

        {rowCategories.fields.length && columnCategories.fields.length && (
          <Table
            header={<Header>Preview</Header>}
            items={rowCategories.fields.map((field) => {
              return {
                key: field.id,
                name: field.name,
              };
            })}
            columnDefinitions={[
              {
                header: "",
                cell: ({ name }) => name,
              },
              ...columnCategories.fields.map((field) => {
                return {
                  key: field.id,
                  header: field.name,
                  cell: () => null,
                };
              }),
            ]}
          />
        )}

        <Box float="right">
          <Button
            variant="primary"
            formAction="submit"
            loading={isSubmitting}
            disabled={!agents.fields.length}
          >
            Create Workflow
          </Button>
        </Box>
      </SpaceBetween>
    </form>
  );
};
