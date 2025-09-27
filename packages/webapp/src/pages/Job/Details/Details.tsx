import type { UseQueryResult } from "@tanstack/react-query";
import { DescriptionInput } from "./DescriptionInput";
import type { GetJobQuery } from "../../../API";
import { SourceInput } from "./SourceInput";
import { useParams } from "react-router";
import { NameInput } from "./NameInput";

import {
  KeyValuePairs,
  ColumnLayout,
  Header,
  Box,
  Button,
} from "@cloudscape-design/components";
import { KbInput } from "./KbInput";

interface IDetails {
  getJobQuery: UseQueryResult<GetJobQuery, Error>;
}

export const Details = ({ getJobQuery }: IDetails) => {
  const { jobId } = useParams();

  return (
    <ColumnLayout columns={1}>
      <Box>
        <Header
          variant="h3"
          className="mb-3"
          actions={
            <Button
              loading={getJobQuery.isRefetching}
              onClick={() => getJobQuery.refetch()}
              iconName="refresh"
              variant="inline-icon"
            />
          }
        >
          Job Information
        </Header>

        <KeyValuePairs
          columns={3}
          items={[
            {
              label: (
                <h3 className="mb-1 text-sm font-medium text-[#a0a0a0]">
                  Name
                </h3>
              ),
              value: <NameInput getJobQuery={getJobQuery} />,
            },
            {
              label: (
                <h3 className="mb-1 text-sm font-medium text-[#a0a0a0]">
                  Bedrock Knowledge Base
                </h3>
              ),
              value: <KbInput getJobQuery={getJobQuery} />,
            },
            {
              label: (
                <h3 className="mb-1 text-sm font-medium text-[#a0a0a0]">
                  Job ID
                </h3>
              ),
              value: (
                <div className="text-sm text-white font-mono">{jobId}</div>
              ),
            },
            {
              label: (
                <h3 className="mb-1 text-sm font-medium text-[#a0a0a0]">
                  Description
                </h3>
              ),
              value: <DescriptionInput getJobQuery={getJobQuery} />,
            },
            {
              label: (
                <h3 className="mb-1 text-sm font-medium text-[#a0a0a0]">
                  Created At
                </h3>
              ),
              value: (
                <div className="text-sm text-white font-mono">
                  {getJobQuery.data?.getJob?.createdAt}
                </div>
              ),
            },
            {
              label: (
                <h3 className="mb-1 text-sm font-medium text-[#a0a0a0]">
                  Updated At
                </h3>
              ),
              value: (
                <div className="text-sm text-white font-mono">
                  {getJobQuery.data?.getJob?.updatedAt}
                </div>
              ),
            },
          ]}
        />
      </Box>

      <h3 className="text-sm font-medium text-[#a0a0a0]">S3 Source Path</h3>
      <SourceInput getJobQuery={getJobQuery} />
    </ColumnLayout>
  );
};
