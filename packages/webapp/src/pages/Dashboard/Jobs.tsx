import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";

import {
  Button,
  Header,
  Table,
  Box,
  SpaceBetween,
} from "@cloudscape-design/components";

import {
  useGraphQLMutation,
  useGraphQLQuery,
} from "../../hooks/useTanStackQuery";

export const Jobs = () => {
  const listJobsQuery = useGraphQLQuery("listJobs");

  const delJobMutation = useGraphQLMutation("deleteJob");

  const navigate = useNavigate();

  return (
    <>
      <Table
        header={
          <Header
            variant="h3"
            actions={
              <Button
                variant="link"
                iconName="refresh"
                loading={listJobsQuery.isRefetching}
                onClick={() => listJobsQuery.refetch()}
              />
            }
          >
            Jobs
          </Header>
        }
        variant="embedded"
        columnDefinitions={[
          {
            id: "jobId",
            header: "Job Id",
            cell: ({ jobId }) => <p className="font-medium ">{jobId}</p>,
          },
          {
            id: "name",
            header: "Name",
            cell: ({ name }) => name,
          },
          {
            id: "createdAt",
            header: "Created",
            cell: ({ createdAt }) =>
              format(parseISO(createdAt), "MMMM d, yyyy"),
          },
          {
            id: "updatedAt",
            header: "Modified",
            cell: ({ updatedAt }) =>
              format(parseISO(updatedAt), "MMMM d, yyyy"),
          },
          {
            id: "actions",
            header: "Actions",
            cell: ({ jobId }) => (
              <SpaceBetween size="xs" direction="horizontal">
                <Button
                  iconName="search"
                  variant="inline-link"
                  onClick={() => navigate(`/job/${jobId}`)}
                />
                <Button
                  iconName="remove"
                  variant="inline-link"
                  loading={
                    delJobMutation.isPending &&
                    delJobMutation.variables.jobId == jobId
                  }
                  onClick={async () => {
                    try {
                      await delJobMutation.mutateAsync({ jobId });
                      listJobsQuery.refetch();
                      return toast.success("Job deleted!");
                    } catch (error) {
                      return toast.error(JSON.stringify(error, null, 2));
                    }
                  }}
                />
              </SpaceBetween>
            ),
          },
        ]}
        enableKeyboardNavigation
        items={listJobsQuery.data?.listJobs?.jobs ?? []}
        loadingText="Loading jobs"
        loading={listJobsQuery.isLoading}
        sortingDisabled
        empty={
          <Box margin={{ vertical: "xs" }}>
            <b>No jobs</b>
          </Box>
        }
      />
    </>
  );
};
