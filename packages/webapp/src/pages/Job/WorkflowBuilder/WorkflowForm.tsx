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
} from "@cloudscape-design/components";
import toast from "react-hot-toast";

interface WorkflowFormInput {
  agents: { system_prompt: string }[];
}

interface IWorkflowForm {
  onWorkflowCreated: () => void;
}

export const WorkflowForm = ({ onWorkflowCreated }: IWorkflowForm) => {
  const { jobId } = useParams();
  const uploadS3Data = useUploadS3Data();

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<WorkflowFormInput>({
    defaultValues: {
      agents: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "agents",
  });

  const onSubmit: SubmitHandler<WorkflowFormInput> = async (data) => {
    try {
      const fileName = data.workflowName.endsWith(".py")
        ? data.workflowName
        : `${data.workflowName}.py`;

      // Generate workflow code that includes agent definitions
      const agentDefinitions = agents
        .map(
          (agent) =>
            `def ${agent.name.toLowerCase().replace(/\s+/g, "_")}():
    """
    ${agent.description || `${agent.name} responsibilities`}
    """
    # Add ${agent.name} logic here
    pass`
        )
        .join("\n\n");

      const workflowCode = `# Multi-Agent Workflow
# Generated workflow with ${agents.length} agent(s)

${agentDefinitions}

def main():
    """
    Main workflow orchestrator
    """
    print("Starting multi-agent workflow...")
    
    # Execute agents in sequence
${agents
  .map((agent) => `    ${agent.name.toLowerCase().replace(/\s+/g, "_")}()`)
  .join("\n")}
    
    return "Workflow completed successfully"

if __name__ == "__main__":
    main()
`;

      await uploadS3Data.mutateAsync({
        key: `jobs/${jobId}/code/${fileName}`,
        body: workflowCode,
        contentType: "text/plain",
      });

      // Create a README with agent descriptions
      const agentDescriptions = agents
        .map(
          (agent) =>
            `## ${agent.name}\n${
              agent.description || "No description provided"
            }`
        )
        .join("\n\n");

      const readmeContent = `# Multi-Agent Workflow

${data.description || "Multi-agent workflow system"}

## Agents

${agentDescriptions}

## Usage

Run the workflow with:
\`\`\`bash
python ${fileName}
\`\`\`
`;

      await uploadS3Data.mutateAsync({
        key: `jobs/${jobId}/code/README.md`,
        body: readmeContent,
        contentType: "text/plain",
      });

      toast.success("Workflow created successfully!");
      onWorkflowCreated();
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast.error("Failed to create workflow");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SpaceBetween size="l">
        {/* Dynamic Agent Sections */}
        {fields.map((agent, index) => (
          <ExpandableSection
            key={agent.id}
            headerText={`Agent ${index + 1}`}
            headerActions={
              <Button
                variant="icon"
                iconName="close"
                onClick={() => remove(index)}
              />
            }
          >
            <Controller
              name={`agents.${index}.system_prompt`}
              control={control}
              render={({ field }) => (
                <FormField
                  label="Agent Responsibilities"
                  description={`Define what agent should do in this workflow`}
                >
                  <Textarea
                    {...field}
                    onChange={({ detail }) => field.onChange(detail.value)}
                    name={`agents.${index}.system_prompt`}
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
          onClick={() => append({ system_prompt: "" })}
          iconName="add-plus"
        >
          Add Agent
        </Button>

        <ExpandableSection headerText="Assessment Schema">
          <Controller
            name="outputSchema"
            control={control}
            render={({ field }) => (
              <FormField
                label="Output Schema"
                description="Define the structure of the workflow output"
              >
                <Textarea
                  {...field}
                  placeholder="Define the expected output format, data structure, or assessment criteria..."
                  rows={6}
                />
              </FormField>
            )}
          />
        </ExpandableSection>

        <Box float="right">
          <Button
            variant="primary"
            formAction="submit"
            loading={isSubmitting || uploadS3Data.isPending}
            disabled={!fields.length}
          >
            Create Workflow
          </Button>
        </Box>
      </SpaceBetween>
    </form>
  );
};
