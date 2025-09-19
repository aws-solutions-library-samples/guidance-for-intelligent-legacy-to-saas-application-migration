import { WorkflowVisualizerWrapper } from "../../../components/WorkflowVisualizer";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { ChatBubble, Avatar } from "@cloudscape-design/chat-components";
import type { UseQueryResult } from "@tanstack/react-query";
import { useGetS3Json } from "../../../hooks/useApi";
import type { GetJobQuery } from "../../../API";
import { MarkdownHooks } from "react-markdown";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { capitalize } from "lodash";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";

import {
  useGraphQLMutation,
  useGraphQLQuery,
} from "../../../hooks/useTanStackQuery";

import {
  Header,
  Box,
  KeyValuePairs,
  Link,
  Spinner,
  Button,
  ExpandableSection,
  Container,
  SpaceBetween,
  StatusIndicator,
  Alert,
  Table,
  Modal,
  Select,
  FormField,
  Toggle,
} from "@cloudscape-design/components";

interface ActionItem {
  message?: {
    role: string;
    content: MessageContent[];
  };
}

interface MessageContent {
  text?: string;
  toolUse?: {
    name: string;
    input: unknown;
  };
  toolResult?: {
    status:
      | "success"
      | "error"
      | "warning"
      | "info"
      | "in-progress"
      | "stopped";
    content: { text: string }[];
  };
  reasoningContent?: {
    reasoningText: {
      text: string;
    };
  };
}

interface AssessmentItem {
  type: string;
  teamcenter_artifact_name: string;
  detailed_summary: string;
  tier: "standard" | "advanced" | "premium";
}

interface AssessmentTableRow {
  classification: string;
  standard: { name: string; summary: string }[];
  advanced: { name: string; summary: string }[];
  premium: { name: string; summary: string }[];
}

interface ExecutionStatus {
  status?: string;
  error?: string;
  cause?: string;
}

type SettingInputs = {
  model: {
    label: string;
    value: string;
  };
  streaming: boolean;
};

interface IAssessment {
  getJobQuery: UseQueryResult<GetJobQuery, Error>;
}

export const Assessment = ({ getJobQuery }: IAssessment) => {
  const { jobId } = useParams();
  const describeExecution = useGraphQLQuery("describeExecution", {
    executionArn: getJobQuery.data?.getJob?.executionArn ?? "",
  });
  const [settings, setSettings] = useState(false);

  const startAssessmentMutation = useGraphQLMutation("startAssessment");
  const foundationModelsQuery = useGraphQLQuery("listInferenceProfiles");
  const updateJobMutation = useGraphQLMutation("updateJob");

  const tree = useGetS3Json(`jobs/${jobId}/tree.json`);
  const flow = useGetS3Json(`jobs/${jobId}/flow.json`);
  const assessment = useGetS3Json(`jobs/${jobId}/assessment.json`);
  const executiveSummary = useGetS3Json(`jobs/${jobId}/executive_summary.json`);

  const [assessmentTbl, setAssessmentTbl] = useState<AssessmentTableRow[]>([]);
  const [summaryWindow, setSummaryWindow] = useState("");

  // Parse execution status safely
  const executionStatus: ExecutionStatus = describeExecution.data
    ?.describeExecution
    ? JSON.parse(describeExecution.data.describeExecution)
    : {};

  const { control, handleSubmit } = useForm<SettingInputs>();

  useEffect(() => {
    const assessmentTblData: AssessmentTableRow[] = [
      {
        classification: "Features",
        standard: [],
        advanced: [],
        premium: [],
      },
      {
        classification: "Configurations",
        standard: [],
        advanced: [],
        premium: [],
      },
      {
        classification: "Customizations",
        standard: [],
        advanced: [],
        premium: [],
      },
    ];

    if (assessment.data && Array.isArray(assessment.data)) {
      for (const element of assessment.data as AssessmentItem[]) {
        if (
          !element.type ||
          !element.tier ||
          !element.teamcenter_artifact_name
        ) {
          console.warn("Invalid assessment item:", element);
          continue;
        }

        const classificationIndex =
          element.type.toLowerCase() === "feature"
            ? 0
            : element.type.toLowerCase() === "configuration"
            ? 1
            : element.type.toLowerCase() === "customization"
            ? 2
            : -1;

        if (
          classificationIndex >= 0 &&
          ["standard", "advanced", "premium"].includes(
            element.tier.toLowerCase()
          )
        ) {
          assessmentTblData[classificationIndex][element.tier].push({
            name: element.teamcenter_artifact_name,
            summary: element.detailed_summary || "",
          });
        } else {
          console.warn("Unknown classification or tier:", element);
        }
      }
    }

    setAssessmentTbl(assessmentTblData);
  }, [assessment.data]);

  const onSubmit: SubmitHandler<SettingInputs> = async (data) => {
    const { streaming } = data;

    try {
      await startAssessmentMutation.mutateAsync({
        jobId,
        streaming,
      });
      getJobQuery.refetch();
      return toast.success("Assessment Started");
    } catch (error) {
      return toast.error(JSON.stringify(error, null, 2));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SpaceBetween size="l">
        <Header
          variant="h3"
          actions={
            <SpaceBetween size={"m"} direction="horizontal">
              <Button
                loading={startAssessmentMutation.isPending}
                disabled={
                  !getJobQuery.data?.getJob?.kb ||
                  !getJobQuery.data?.getJob?.s3Uri ||
                  !getJobQuery.data?.getJob?.agentcoreId ||
                  executionStatus.status === "RUNNING"
                }
              >
                Start Assessment
              </Button>
              <Button
                formAction="none"
                loading={describeExecution.isRefetching}
                onClick={() => {
                  describeExecution.refetch();
                  getJobQuery.refetch();
                }}
                iconName="refresh"
              />
              <Button
                formAction="none"
                onClick={() => setSettings(true)}
                iconName="settings"
                variant="link"
              />
            </SpaceBetween>
          }
        >
          Assessment Information
        </Header>

        <KeyValuePairs
          columns={1}
          items={[
            {
              label: (
                <h3 className="my-1 text-sm font-medium text-[#a0a0a0] flex items-center">
                  Bedrock AgentCore Definition
                </h3>
              ),
              value: (
                <Link
                  external
                  href={`https://${
                    import.meta.env.VITE_REGION
                  }.console.aws.amazon.com/bedrock-agentcore/agents/${
                    getJobQuery.data?.getJob?.agentcoreId
                  }`}
                >
                  {getJobQuery.data?.getJob?.agentcoreId}
                </Link>
              ),
            },
          ]}
        />

        {getJobQuery.data?.getJob?.executionArn && (
          <KeyValuePairs
            columns={2}
            items={[
              {
                label: (
                  <h3 className="mb-1 text-sm font-medium text-[#a0a0a0] flex items-center">
                    Step Function
                  </h3>
                ),
                value: (
                  <Link
                    external
                    href={`https://${
                      import.meta.env.VITE_REGION
                    }.console.aws.amazon.com/states/home?region=${
                      import.meta.env.VITE_REGION
                    }#/v2/executions/details/${
                      getJobQuery.data?.getJob?.executionArn
                    }`}
                  >
                    {getJobQuery.data?.getJob?.executionArn}
                  </Link>
                ),
              },
              {
                label: (
                  <h3 className="mb-1 text-sm font-medium text-[#a0a0a0] flex items-center">
                    Status
                  </h3>
                ),
                value: describeExecution.isLoading ? (
                  <Spinner />
                ) : (
                  <pre className="whitespace-pre-wrap">
                    {executionStatus.status || "Unknown"}
                  </pre>
                ),
              },
            ]}
          />
        )}

        {!(
          JSON.parse(describeExecution.data?.describeExecution ?? "{}")
            .status === "RUNNING"
        ) &&
        JSON.parse(describeExecution.data?.describeExecution ?? "{}").status ===
          "FAILED" ? (
          <Alert
            className="mt-5"
            type="error"
            header={
              JSON.parse(describeExecution.data?.describeExecution ?? "{}")
                .error
            }
          >
            <pre className="whitespace-pre-wrap">
              {
                JSON.parse(describeExecution.data?.describeExecution ?? "{}")
                  .cause
              }
            </pre>
          </Alert>
        ) : (
          <>
            {tree.data && (
              <Box>
                <Header variant="h3" className="mb-3">
                  Workflow Visualization
                </Header>

                <WorkflowVisualizerWrapper data={tree.data} />
              </Box>
            )}

            {flow.data && (
              <Box>
                <Header variant="h3" className="my-3">
                  Agentic Flow
                </Header>

                {flow.data?.agent_order.map((agent: string, index: number) => {
                  return (
                    <ExpandableSection
                      headerText={`${index + 1}. ${agent}`}
                      key={index}
                    >
                      <Container>
                        <SpaceBetween size="xxs">
                          {flow.data.agent_workflows[agent].map(
                            (action: ActionItem) => {
                              if (action.message) {
                                return action.message.content.map(
                                  (message: MessageContent) => {
                                    if (message.text) {
                                      return (
                                        <ChatBubble
                                          ariaLabel={"chat"}
                                          type={
                                            action.message?.role == "assistant"
                                              ? "incoming"
                                              : "outgoing"
                                          }
                                          avatar={
                                            <Avatar
                                              ariaLabel={"chat"}
                                              tooltipText={
                                                action.message?.role ==
                                                "assistant"
                                                  ? "Strands Agent"
                                                  : "Tool Response"
                                              }
                                              color="gen-ai"
                                              iconName="gen-ai"
                                            />
                                          }
                                        >
                                          <pre className="revert-tailwind whitespace-pre-wrap leading-none">
                                            <MarkdownHooks
                                              remarkPlugins={[remarkGfm]}
                                            >
                                              {message.text}
                                            </MarkdownHooks>
                                          </pre>
                                        </ChatBubble>
                                      );
                                    } else if (message.toolUse) {
                                      return (
                                        <ChatBubble
                                          ariaLabel={"toolUse"}
                                          type={"incoming"}
                                          hideAvatar
                                          avatar={
                                            <Avatar ariaLabel={"toolUse"} />
                                          }
                                        >
                                          <KeyValuePairs
                                            items={[
                                              {
                                                label: "toolUse",
                                                value: message.toolUse.name,
                                              },
                                              {
                                                label: "input",
                                                value: (
                                                  <pre className="whitespace-pre-wrap">
                                                    {JSON.stringify(
                                                      message.toolUse.input,
                                                      null,
                                                      2
                                                    )}
                                                  </pre>
                                                ),
                                              },
                                            ]}
                                          />
                                        </ChatBubble>
                                      );
                                    } else if (message.toolResult) {
                                      return (
                                        <ChatBubble
                                          ariaLabel={"toolResult"}
                                          type={"outgoing"}
                                          actions={
                                            <StatusIndicator
                                              type={message.toolResult.status}
                                            >
                                              {capitalize(
                                                message.toolResult.status
                                              )}
                                            </StatusIndicator>
                                          }
                                          avatar={
                                            <Avatar
                                              ariaLabel={"toolResult"}
                                              tooltipText={"Tool Result"}
                                            />
                                          }
                                        >
                                          <ExpandableSection headerText="toolResult">
                                            <pre className="revert-tailwind whitespace-pre-wrap leading-none">
                                              <MarkdownHooks
                                                remarkPlugins={[remarkGfm]}
                                              >
                                                {
                                                  message.toolResult.content[0]
                                                    .text
                                                }
                                              </MarkdownHooks>
                                            </pre>
                                          </ExpandableSection>
                                        </ChatBubble>
                                      );
                                    }
                                    if (
                                      message.reasoningContent?.reasoningText
                                    ) {
                                      return (
                                        <ChatBubble
                                          ariaLabel={"chat"}
                                          type={"outgoing"}
                                          avatar={
                                            <Avatar
                                              ariaLabel={"chat"}
                                              tooltipText={
                                                "AI reasoning with itself"
                                              }
                                              iconName="gen-ai"
                                            />
                                          }
                                        >
                                          <KeyValuePairs
                                            items={[
                                              {
                                                label: "Reasoning",
                                                value: (
                                                  <pre className="whitespace-pre-wrap">
                                                    {
                                                      message.reasoningContent
                                                        ?.reasoningText.text
                                                    }
                                                  </pre>
                                                ),
                                              },
                                            ]}
                                          />
                                        </ChatBubble>
                                      );
                                    }
                                    return (
                                      <pre className="whitespace-pre-wrap">
                                        {JSON.stringify(message, null, 2)}
                                      </pre>
                                    );
                                  }
                                );
                              }
                              return (
                                <pre>{JSON.stringify(action, null, 2)}</pre>
                              );
                            }
                          )}
                        </SpaceBetween>
                      </Container>
                    </ExpandableSection>
                  );
                })}
              </Box>
            )}

            {executiveSummary.data && (
              <>
                <Header variant="h3" className="mt-5">
                  Executive Summary
                </Header>
                <ExpandableSection headerText={"Learn more"}>
                  <Container className="bg-[#0f141a]!">
                    <pre className="revert-tailwind leading-none whitespace-pre-wrap">
                      <MarkdownHooks remarkPlugins={[remarkGfm]}>
                        {executiveSummary.data.executive_summary}
                      </MarkdownHooks>
                    </pre>
                  </Container>
                </ExpandableSection>
              </>
            )}

            {assessment.data && (
              <Container className="mt-5 bg-[#FAF9F6]!">
                <Header variant="h3">
                  <span className="text-black">Assessment Table</span>
                </Header>

                <Table
                  contentDensity="compact"
                  columnDefinitions={[
                    {
                      id: "classification",
                      header: null,
                      cell: (item) => (
                        <Box fontWeight="bold" className="text-black!">
                          {item.classification}
                        </Box>
                      ),
                    },
                    {
                      id: "tcxStandard",
                      header: <span className="text-black">TCX Standard</span>,
                      cell: (item) => (
                        <SpaceBetween size="xxxs">
                          {item.standard?.map((feature, index) => (
                            <Button
                              formAction="none"
                              variant="link"
                              onClick={() => setSummaryWindow(feature.summary)}
                              key={index}
                            >
                              {feature.name}
                            </Button>
                          ))}
                        </SpaceBetween>
                      ),
                    },
                    {
                      id: "tcxAdvanced",
                      header: <span className="text-black">TCX Advanced</span>,
                      cell: (item) => (
                        <SpaceBetween size="xxxs">
                          {item.advanced?.map((feature, index) => (
                            <Button
                              formAction="none"
                              variant="link"
                              onClick={() => setSummaryWindow(feature.summary)}
                              key={index}
                            >
                              {feature.name}
                            </Button>
                          ))}
                        </SpaceBetween>
                      ),
                    },
                    {
                      id: "tcxPremium",
                      header: <span className="text-black">TCX Premium</span>,
                      cell: (item) => (
                        <SpaceBetween size="xxxs">
                          {item.premium?.map((feature, index) => (
                            <Button
                              formAction="none"
                              variant="link"
                              onClick={() => setSummaryWindow(feature.summary)}
                              key={index}
                            >
                              {feature.name}
                            </Button>
                          ))}
                        </SpaceBetween>
                      ),
                    },
                  ]}
                  items={assessmentTbl}
                  variant="borderless"
                  wrapLines
                />
              </Container>
            )}

            {summaryWindow && (
              <>
                <Header variant="h3" className="my-5">
                  Assessment Summary
                </Header>
                <Container className="bg-[#0f141a]!">
                  <pre className="revert-tailwind leading-none whitespace-pre-wrap">
                    <MarkdownHooks remarkPlugins={[remarkGfm]}>
                      {summaryWindow}
                    </MarkdownHooks>
                  </pre>
                </Container>
              </>
            )}
          </>
        )}
      </SpaceBetween>

      <Modal
        header={<Header>Settings</Header>}
        visible={settings}
        onDismiss={() => setSettings(false)}
      >
        <SpaceBetween size="l">
          {foundationModelsQuery.isLoading ? (
            <Spinner />
          ) : (
            <Controller
              name="model"
              defaultValue={getJobQuery.data?.getJob?.model ?? undefined}
              rules={{ required: true }}
              render={({ field }) => (
                <FormField description="Foundation model to use" label="Model">
                  <Select
                    {...field}
                    filteringType="auto"
                    selectedOption={field.value}
                    onChange={async ({ detail }) => {
                      try {
                        await updateJobMutation.mutateAsync({
                          input: {
                            jobId,
                            model: detail.selectedOption,
                          },
                        });
                        field.onChange(detail.selectedOption);
                        return toast.success("Model ID updated!");
                      } catch (error) {
                        return toast.error(JSON.stringify(error, null, 2));
                      }
                    }}
                    options={foundationModelsQuery.data?.listInferenceProfiles?.inferenceProfileSummaries?.map(
                      (profile) => {
                        return {
                          label: profile.inferenceProfileName!,
                          value: profile.inferenceProfileId!,
                        };
                      }
                    )}
                  />
                </FormField>
              )}
              control={control}
            />
          )}
          <Controller
            name="streaming"
            defaultValue={false}
            render={({ field }) => (
              <FormField
                description="Whether the model streams to itself"
                label="Streaming"
              >
                <Toggle
                  {...field}
                  onChange={({ detail }) => field.onChange(detail.checked)}
                  checked={field.value}
                />
              </FormField>
            )}
            control={control}
          />
        </SpaceBetween>
      </Modal>
    </form>
  );
};
