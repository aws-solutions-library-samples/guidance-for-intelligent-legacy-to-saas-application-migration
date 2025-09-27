import {
  Box,
  Button,
  ColumnLayout,
  Header,
  KeyValuePairs,
  Link,
  SpaceBetween,
  Spinner,
} from "@cloudscape-design/components";
import {
  useGraphQLMutation,
  useGraphQLQuery,
} from "../../../hooks/useTanStackQuery";
import { useParams } from "react-router";

interface IDeployment {
  codebuildArn?: string | null;
}

export const Deployment = ({ codebuildArn }: IDeployment) => {
  const { jobId } = useParams();

  const startDeployment = useGraphQLMutation("startDeployment");

  const codebuildJob = useGraphQLQuery("getCodeBuild", {
    codebuildArn,
  });

  JSON.parse(codebuildJob.data?.getCodeBuild ?? "{}");

  return (
    <ColumnLayout className="mt-3" columns={1}>
      <Box>
        <Header
          variant="h3"
          className="mb-3"
          actions={
            <SpaceBetween size="m" direction="horizontal">
              <Button
                formAction="none"
                variant="primary"
                disabled={
                  JSON.parse(codebuildJob.data?.getCodeBuild ?? "{}")
                    .builds?.[0].buildStatus == "IN_PROGRESS"
                }
                loading={startDeployment.isPending}
                onClick={() => startDeployment.mutate({ jobId })}
              >
                Build Workflow
              </Button>
              <Button
                variant="link"
                iconName="refresh"
                loading={codebuildJob.isRefetching}
                onClick={() => codebuildJob.refetch()}
              />
            </SpaceBetween>
          }
        >
          Deployment
        </Header>

        <KeyValuePairs
          columns={2}
          items={[
            {
              label: (
                <h3 className="mb-1 text-sm font-medium text-[#a0a0a0] flex items-center">
                  Build Job
                </h3>
              ),
              value: (
                <Link
                  external
                  href={`https://${
                    import.meta.env.VITE_REGION
                  }.console.aws.amazon.com/codesuite/codebuild/projects/${
                    JSON.parse(codebuildJob.data?.getCodeBuild ?? "{}")
                      .builds?.[0].projectName
                  }/build/${
                    JSON.parse(codebuildJob.data?.getCodeBuild ?? "{}")
                      .builds?.[0].id
                  }`}
                >
                  Link
                </Link>
              ),
            },
            {
              label: (
                <h3 className="mb-1 text-sm font-medium text-[#a0a0a0] flex items-center">
                  Build Status
                </h3>
              ),
              value: codebuildJob.isLoading ? (
                <Spinner />
              ) : (
                <pre className="whitespace-pre-wrap">
                  {
                    JSON.parse(codebuildJob.data?.getCodeBuild ?? "{}")
                      .builds?.[0].buildStatus
                  }
                </pre>
              ),
            },
            {
              label: (
                <h3 className="mb-1 text-sm font-medium text-[#a0a0a0] flex items-center">
                  Cloudwatch Logs
                </h3>
              ),
              value: (
                <Link
                  external
                  href={
                    JSON.parse(codebuildJob.data?.getCodeBuild ?? "{}")
                      .builds?.[0].logs.deepLink
                  }
                >
                  Link
                </Link>
              ),
            },
          ]}
        />
      </Box>
    </ColumnLayout>
  );
};
