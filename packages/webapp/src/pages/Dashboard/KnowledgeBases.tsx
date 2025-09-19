import { Box, Button, Header, Table } from "@cloudscape-design/components";
import { useGraphQLQuery } from "../../hooks/useTanStackQuery";
import { format, parseISO } from "date-fns";

export const KnowledgeBases = () => {
  const listKnowledgeBases = useGraphQLQuery("listKnowledgeBases");

  return (
    <Table
      header={
        <Header
          variant="h3"
          actions={
            <Button
              variant="link"
              iconName="refresh"
              loading={listKnowledgeBases.isRefetching}
              onClick={() => listKnowledgeBases.refetch()}
            />
          }
        >
          Knowledge Bases
        </Header>
      }
      variant="embedded"
      columnDefinitions={[
        {
          id: "id",
          header: "ID",
          cell: ({ knowledgeBaseId }) => (
            <p className="font-medium">{knowledgeBaseId}</p>
          ),
        },
        {
          id: "name",
          header: "Name",
          cell: ({ name }) => name,
        },
        {
          id: "status",
          header: "Status",
          cell: ({ status }) => status,
        },
        {
          id: "updatedAt",
          header: "Modified",
          cell: ({ updatedAt }) => format(parseISO(updatedAt), "MMMM d, yyyy"),
        },
      ]}
      enableKeyboardNavigation
      items={
        listKnowledgeBases.data?.listKnowledgeBases?.knowledgeBaseSummaries ??
        []
      }
      loadingText="Loading knowledge bases"
      loading={listKnowledgeBases.isLoading}
      empty={
        <Box margin={{ vertical: "xs" }}>
          <b>No knowledge bases</b>
        </Box>
      }
    />
  );
};
