import {
  Box,
  ColumnLayout,
  KeyValuePairs,
  Link,
  Spinner,
} from "@cloudscape-design/components";
import type {
  DefinedQueryObserverResult,
  QueryObserverPlaceholderResult,
} from "@tanstack/react-query";
import type { GetCodeBuildQuery } from "../../../API";

interface IDeployment {
  codebuildJob:
    | DefinedQueryObserverResult<GetCodeBuildQuery, Error>
    | QueryObserverPlaceholderResult<GetCodeBuildQuery, Error>;
}

export const Deployment = ({ codebuildJob }: IDeployment) => {
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
                    codebuildJob.data?.getCodeBuild?.projectName
                  }/build/${codebuildJob.data?.getCodeBuild?.id}`}
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
                    JSON.parse(codebuildJob.data?.getCodeBuild?.logs ?? "{}")
                      .deepLink
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
                  {codebuildJob.data?.getCodeBuild?.buildStatus}
                </pre>
              ),
            },
          ]}
        />
      </Box>
    </ColumnLayout>
  );
};
