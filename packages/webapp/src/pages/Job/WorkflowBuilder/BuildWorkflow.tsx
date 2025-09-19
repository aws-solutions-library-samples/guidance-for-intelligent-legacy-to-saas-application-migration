import { type Dispatch, type SetStateAction } from "react";
import { Box, Button, Header, Modal } from "@cloudscape-design/components";
import toast from "react-hot-toast";
import { useGraphQLMutation } from "../../../hooks/useTanStackQuery";
import { useParams } from "react-router";
import type { UseQueryResult } from "@tanstack/react-query";
import type { GetJobQuery } from "../../../API";

interface IbuildWorkflow {
  buildWorkflow: boolean;
  setBuildWorkflow: Dispatch<SetStateAction<boolean>>;
  getJobQuery: UseQueryResult<GetJobQuery, Error>;
}

export const BuildWorkflow = ({
  buildWorkflow,
  setBuildWorkflow,
  getJobQuery,
}: IbuildWorkflow) => {
  const { jobId } = useParams();
  const startDeployment = useGraphQLMutation("startDeployment");

  return (
    <Modal
      onDismiss={() => {
        if (!startDeployment.isPending) setBuildWorkflow(false);
      }}
      visible={buildWorkflow}
      header={
        <Header description="Build and deploy the current codebase to assessment">
          Start Deployment
        </Header>
      }
    >
      <Box textAlign="center">
        <Button
          className="m-5"
          loading={startDeployment.isPending}
          onClick={async () => {
            try {
              await startDeployment.mutateAsync({ jobId });
              getJobQuery.refetch();
              setBuildWorkflow(false);
              toast.success("Deployment started");
            } catch (error) {
              toast.error(JSON.stringify(error, null, 2));
            }
          }}
        >
          Start Deployment
        </Button>
      </Box>
    </Modal>
  );
};
