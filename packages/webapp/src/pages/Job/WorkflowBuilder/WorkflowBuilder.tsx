import { useListS3 } from "../../../hooks/useApi";
import { useParams } from "react-router";
import { CodeInput } from "./CodeInput";
import { useState } from "react";

import {
  Header,
  Box,
  SpaceBetween,
  Link,
  ButtonDropdown,
} from "@cloudscape-design/components";

import "ace-builds/css/ace.css";
import "ace-builds/css/theme/cloud_editor.css";
import "ace-builds/css/theme/cloud_editor_dark.css";
import { CreateTool } from "./CreateTool";
import toast from "react-hot-toast";
import { NewFile } from "./NewFile";
import { DelFile } from "./DelFile";
import type { UseQueryResult } from "@tanstack/react-query";
import type { GetJobQuery } from "../../../API";
import { Deployment } from "./Deployment";
import { WorkflowForm } from "./WorkflowForm";

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
              <ButtonDropdown
                onItemClick={({ detail }) => {
                  switch (detail.id) {
                    case "createTool":
                      return setCreateTool(true);
                    case "newFile":
                      return setNewFile(true);
                    case "delFile":
                      return setDelFile(true);
                    default:
                      toast.error(`Unknown id: ${detail.id}`);
                  }
                }}
                items={[
                  { text: "Create Tool", id: "createTool" },
                  { text: "New File", id: "newFile" },
                  { text: "Delete File", id: "delFile" },
                ]}
              >
                Editor Actions
              </ButtonDropdown>
            )
          }
        >
          Workflow Builder
        </Header>

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

      {!!listS3.data?.items.length && (
        <>
          <Deployment codebuildArn={getJobQuery.data?.getJob?.codebuildArn} />

          {/* Modals */}
          <CreateTool createTool={createTool} setCreateTool={setCreateTool} />
          <NewFile newFile={newFile} setNewFile={setNewFile} listS3={listS3} />
          <DelFile delFile={delFile} setDelFile={setDelFile} listS3={listS3} />
        </>
      )}
    </>
  );
};
