import {
  Box,
  ColumnLayout,
  KeyValuePairs,
  Link,
  Spinner,
} from "@cloudscape-design/components";
import { useGraphQLQuery } from "../../../hooks/useTanStackQuery";

interface IDeployment {
  codebuildArn?: string | null;
}

export const Deployment = ({ codebuildArn }: IDeployment) => {
  const codebuildJob = useGraphQLQuery("getCodeBuild", {
    codebuildArn,
  });

  JSON.parse(codebuildJob.data?.getCodeBuild ?? "{}");

  return (
    <ColumnLayout className="mt-3" columns={1}>
      <Box>
        <KeyValuePairs
          columns={3}
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
          ]}
        />
      </Box>
    </ColumnLayout>
  );
};
