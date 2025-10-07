import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import type { UseQueryResult } from "@tanstack/react-query";
import { useGetS3Json } from "../../../hooks/useApi";
import type { GetJobQuery } from "../../../API";
import { MarkdownHooks } from "react-markdown";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
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
  Container,
  SpaceBetween,
  Alert,
  Table,
  Modal,
  Select,
  FormField,
  Toggle,
} from "@cloudscape-design/components";

type SettingInputs = {
  model: {
    label: string;
    value: string;
  };
  streaming: boolean;
};

type RowItem = {
  __typename: "StringSet";
  SS?: (string | null)[] | null;
} | null;

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

  const assessment = useGetS3Json(`jobs/${jobId}/assessment.json`);

  const [assessmentTbl, setAssessmentTbl] = useState<
    Record<string, Array<{ name: string; summary: string }>>
  >({});
  const [summaryWindow, setSummaryWindow] = useState("");

  const { control, handleSubmit } = useForm<SettingInputs>();

  useEffect(() => {
    const tableMap: Record<
      string,
      Array<{ name: string; summary: string }>
    > = {};

    if (
      assessment.data?.parse_results &&
      Array.isArray(assessment.data.parse_results)
    ) {
      for (const element of assessment.data.parse_results) {
        const key = `${element.rows}${element.columns}`;
        if (Array.isArray(tableMap[key])) {
          tableMap[key].push({
            name: element.artifact_name,
            summary: element.detailed_summary || "",
          });
        } else {
          tableMap[key] = [
            {
              name: element.artifact_name,
              summary: element.detailed_summary || "",
            },
          ];
        }
      }
    }

    setAssessmentTbl(tableMap);
  }, [assessment.data?.parse_results]);

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
                  describeExecution.data?.describeExecution?.status ===
                    "RUNNING"
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
                  assessment.refetch();
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
          columns={2}
          items={[
            {
              label: (
                <h3 className="my-1 text-sm font-medium text-[#a0a0a0] flex items-center">
                  Bedrock AgentCore
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
                  Definition
                </Link>
              ),
            },
            {
              label: (
                <h3 className="my-1 text-sm font-medium text-[#a0a0a0] flex items-center">
                  AgentCore Logs
                </h3>
              ),
              value: (
                <Link
                  external
                  href={`https://${
                    import.meta.env.VITE_REGION
                  }.console.aws.amazon.com/cloudwatch/home#logsV2:log-groups/log-group/$252Faws$252Fbedrock-agentcore$252Fruntimes$252F${
                    getJobQuery.data?.getJob?.agentcoreId
                  }-DEFAULT`}
                >
                  Cloudwatch
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
                    Execution
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
                    {describeExecution.data?.describeExecution?.status ||
                      "Unknown"}
                  </pre>
                ),
              },
            ]}
          />
        )}

        {!(describeExecution.data?.describeExecution?.status === "RUNNING") &&
        describeExecution.data?.describeExecution?.status === "FAILED" ? (
          <Alert
            className="mt-5"
            type="error"
            header={describeExecution.data?.describeExecution.error}
          >
            <pre className="whitespace-pre-wrap">
              {describeExecution.data?.describeExecution.cause}
            </pre>
          </Alert>
        ) : (
          <>
            {assessmentTbl && (
              <Container className="mt-5 bg-[#FAF9F6]!">
                <Header variant="h3">
                  <span className="text-black">Assessment Table</span>
                </Header>

                <Table
                  resizableColumns
                  contentDensity="compact"
                  columnDefinitions={[
                    {
                      header: null,
                      cell: (rowItem: RowItem) => (
                        <Box fontWeight="bold" className="text-black!">
                          {rowItem?.SS?.[0] || ""}
                        </Box>
                      ),
                    },
                    ...(getJobQuery.data?.getJob?.column?.L?.map(
                      (columnItem) => {
                        return {
                          header: (
                            <span className="text-black">
                              {columnItem?.SS?.[0]}
                            </span>
                          ),
                          cell: (rowItem: RowItem) => (
                            <SpaceBetween size="xxxs">
                              {assessmentTbl[
                                `${rowItem?.SS?.[0] ?? ""}${
                                  columnItem?.SS?.[0] ?? ""
                                }`
                              ]?.map(
                                (feature: {
                                  name: string;
                                  summary: string;
                                }) => (
                                  <Button
                                    formAction="none"
                                    variant="link"
                                    onClick={() =>
                                      setSummaryWindow(feature.summary)
                                    }
                                    key={feature.name}
                                  >
                                    {feature.name}
                                  </Button>
                                )
                              )}
                            </SpaceBetween>
                          ),
                        };
                      }
                    ) ?? []),
                  ]}
                  items={getJobQuery.data?.getJob?.row?.L ?? []}
                  variant="embedded"
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
