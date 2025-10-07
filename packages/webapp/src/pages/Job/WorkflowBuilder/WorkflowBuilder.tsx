import { useListS3 } from "../../../hooks/useApi";
import { useParams } from "react-router";
import { CodeInput } from "./CodeInput";
import { useState } from "react";

import {
  Header,
  Box,
  SpaceBetween,
  Link,
  Button,
} from "@cloudscape-design/components";

import "ace-builds/css/ace.css";
import "ace-builds/css/theme/cloud_editor.css";
import "ace-builds/css/theme/cloud_editor_dark.css";
import { CreateTool } from "./CreateTool";
import { NewFile } from "./NewFile";
import { DelFile } from "./DelFile";
import type { UseQueryResult } from "@tanstack/react-query";
import type { GetJobQuery } from "../../../API";
import { Deployment } from "./Deployment";
import { WorkflowForm } from "./WorkflowForm";
import { Avatar } from "@cloudscape-design/chat-components";
import {
  useGraphQLMutation,
  useGraphQLQuery,
} from "../../../hooks/useTanStackQuery";

interface IWorkflowBuilder {
  getJobQuery: UseQueryResult<GetJobQuery, Error>;
}

export const WorkflowBuilder = ({ getJobQuery }: IWorkflowBuilder) => {
  const { jobId } = useParams();
  const listS3 = useListS3(`jobs/${jobId}/code/`, "include");

  const [resource, setResource] = useState({
    uri: `s3://${
      import.meta.env.VITE_UISTORAGEBUCKET
    }/jobs/${jobId}/code/index.py`,
  });

  const codebuildJob = useGraphQLQuery("getCodeBuild", {
    codebuildArn: getJobQuery.data?.getJob?.codebuildArn,
  });
  const startDeployment = useGraphQLMutation("startDeployment");

  const [createTool, setCreateTool] = useState(false);
  const [newFile, setNewFile] = useState(false);
  const [delFile, setDelFile] = useState(false);

  return (
    <>
      <SpaceBetween size="l">
        <Header
          description={
            !listS3.data?.items.length &&
            "Outline each agent's key tasks, then provide the structure of the output table"
          }
          variant="h3"
          actions={
            !!listS3.data?.items.length && (
              <SpaceBetween size="s" direction="horizontal">
                <Button
                  onClick={() => setNewFile(true)}
                  iconName="add-plus"
                  disabled={
                    codebuildJob.data?.getCodeBuild?.buildStatus ==
                    "IN_PROGRESS"
                  }
                />
                <Button
                  onClick={() => setDelFile(true)}
                  iconName="remove"
                  disabled={
                    codebuildJob.data?.getCodeBuild?.buildStatus ==
                    "IN_PROGRESS"
                  }
                />
                <Button
                  formAction="none"
                  variant="primary"
                  disabled={
                    codebuildJob.data?.getCodeBuild?.buildStatus ==
                    "IN_PROGRESS"
                  }
                  loading={startDeployment.isPending}
                  onClick={async () => {
                    await startDeployment.mutateAsync({ jobId });
                    await getJobQuery.refetch();
                    codebuildJob.refetch();
                  }}
                >
                  Build Workflow
                </Button>
                <Button
                  variant="link"
                  iconName="refresh"
                  loading={codebuildJob.isRefetching}
                  onClick={() => codebuildJob.refetch()}
                />
                <Button
                  onClick={() => setCreateTool(true)}
                  variant="inline-link"
                  disabled={
                    codebuildJob.data?.getCodeBuild?.buildStatus ==
                    "IN_PROGRESS"
                  }
                >
                  <Avatar
                    iconName="add-plus"
                    ariaLabel="Create tool with GenAI"
                    color="gen-ai"
                    tooltipText="Create a tool with GenAI"
                  />
                </Button>
              </SpaceBetween>
            )
          }
        >
          Workflow Builder
        </Header>

        {codebuildJob.data && <Deployment codebuildJob={codebuildJob} />}

        {!!listS3.data?.items.length && (
          <Box>
            <ul>
              {listS3.data.items.map((item) => (
                <li key={item.eTag}>
                  {item.path === resource.uri.split("/").slice(3).join("/") ? (
                    <b>{item.path.split("/").slice(3).join("/")}</b>
                  ) : (
                    <Link
                      onClick={() => {
                        setResource({
                          uri: `s3://${import.meta.env.VITE_UISTORAGEBUCKET}/${
                            item.path
                          }`,
                        });
                      }}
                    >
                      {item.path.split("/").slice(3).join("/")}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </Box>
        )}

        {listS3.data?.items.length ? (
          <CodeInput uri={resource.uri} />
        ) : (
          <WorkflowForm refetch={listS3.refetch} />
        )}
      </SpaceBetween>

      {/* Modals */}
      <CreateTool createTool={createTool} setCreateTool={setCreateTool} />
      <NewFile newFile={newFile} setNewFile={setNewFile} listS3={listS3} />
      <DelFile delFile={delFile} setDelFile={setDelFile} listS3={listS3} />
    </>
  );
};
