import {
  Controller,
  useFieldArray,
  useForm,
  type SubmitHandler,
} from "react-hook-form";
import { useParams } from "react-router";
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

interface IWorkflowForm {
  refetch: () => void;
}

export const WorkflowForm = ({ refetch }: IWorkflowForm) => {
  const { jobId } = useParams();
  const createWorkflow = useGraphQLMutation("createWorkflow");

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<WorkflowFormInput>({
    defaultValues: {
      agents: [
        {
          systemPrompt: `You are an Infrastructure Architecture Assessment Agent specializing in VMware migration analysis. Your role is to analyze infrastructure and identify migration contingencies.

INPUTS:
- Knowledge base with VMware best practices and cloud service mappings
- S3 URI containing infrastructure configuration dumps

YOUR TASKS:
1. Inventory current VMware infrastructure components
2. Identify version compatibility issues with target cloud
3. Assess network and storage dependencies
4. Calculate resource requirements and sizing
5. Flag infrastructure-related migration blockers

CLASSIFICATION CRITERIA:
- GO: Component is cloud-ready, no changes needed
- GO_WITH_CONDITIONS: Component needs minor updates or configuration changes
- NO_GO: Component has critical incompatibilities or missing prerequisites

For each infrastructure component, determine:
- Migration readiness status (GO/GO_WITH_CONDITIONS/NO_GO)
- Required remediation actions
- Estimated effort (hours)
- Risk level (LOW/MEDIUM/HIGH/CRITICAL)

OUTPUT REQUIREMENTS:
Provide structured findings that classify each infrastructure component into the contingency categories with specific remediation requirements and timelines.`,
        },
        {
          systemPrompt: `You are a Migration Strategy Planning Agent responsible for assessing migration readiness and identifying planning contingencies.

INPUTS:
- Knowledge base with migration methodologies and best practices
- S3 URI containing application dependencies and infrastructure maps

YOUR TASKS:
1. Map application dependencies and migration waves
2. Assess migration tool compatibility
3. Identify scheduling constraints and downtime windows
4. Evaluate rollback capabilities
5. Document migration prerequisites

CLASSIFICATION CRITERIA:
- GO: Clear migration path, tools ready, dependencies mapped
- GO_WITH_CONDITIONS: Missing prerequisites, unclear dependencies, tool limitations
- NO_GO: Critical dependencies unresolved, no viable migration path

For each workload group, determine:
- Migration readiness status
- Missing prerequisites
- Dependency resolution requirements
- Estimated migration window (hours)
- Business impact level

OUTPUT REQUIREMENTS:
Classify workloads into contingency categories based on migration readiness, dependencies, and tool availability.
`,
        },
      ],
      rowCategories: [
        {
          name: "Infrastructure_Compatibility",
          description:
            "Hardware, vSphere versions, cluster configurations, storage, and network infrastructure compatibility with target cloud",
        },
        {
          name: "Migration_Tooling",
          description:
            "Availability and compatibility of migration tools (HCX, vMotion, SRM), automation capabilities",
        },
        {
          name: "Operational_Readiness",
          description:
            "Team skills, documentation, runbooks, support models, and operational maturity",
        },
        {
          name: "Application_Dependencies",
          description:
            "Application interdependencies, database connections, integration points, and service dependencies",
        },
      ],
      columnCategories: [
        {
          name: "GO",
          description:
            "Component/area is fully ready for migration with no blockers or conditions",
        },
        {
          name: "GO_WITH_CONDITIONS",
          description:
            "Migration possible but requires specific remediations or conditions to be met first",
        },
        {
          name: "NO_GO",
          description:
            "Critical blockers prevent migration until major issues are resolved",
        },
      ],
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
      await createWorkflow.mutateAsync({ input: { ...data, jobId } });
      refetch();
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
            defaultExpanded
            key={agent.id}
            headerText={`Agent ${index + 1}`}
            headerActions={
              <Button
                disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
          disabled={isSubmitting}
        >
          Add Agent
        </Button>

        <Header>Assessment Schema</Header>

        <ExpandableSection headerText={`Column Categories`} defaultExpanded>
          <SpaceBetween size="l">
            {columnCategories.fields.map((_, index) => (
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
              disabled={isSubmitting}
            >
              Add
            </Button>
          </SpaceBetween>
        </ExpandableSection>

        <ExpandableSection headerText={`Row Categories`} defaultExpanded>
          <SpaceBetween size="l">
            {rowCategories.fields.map((_, index) => (
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
              disabled={isSubmitting}
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
