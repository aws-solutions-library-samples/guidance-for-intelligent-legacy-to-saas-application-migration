/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getJob = /* GraphQL */ `query GetJob($jobId: ID) {
  getJob(jobId: $jobId) {
    jobId
    name
    description
    createdAt
    updatedAt
    s3Uri
    executionArn
    codebuildArn
    kb {
      label
      value
      __typename
    }
    model {
      label
      value
      __typename
    }
    agentcoreId
    __typename
  }
}
` as GeneratedQuery<APITypes.GetJobQueryVariables, APITypes.GetJobQuery>;
export const getCodeBuild = /* GraphQL */ `query GetCodeBuild($codebuildArn: String) {
  getCodeBuild(codebuildArn: $codebuildArn)
}
` as GeneratedQuery<
  APITypes.GetCodeBuildQueryVariables,
  APITypes.GetCodeBuildQuery
>;
export const listJobs = /* GraphQL */ `query ListJobs($limit: Int, $nextToken: String) {
  listJobs(limit: $limit, nextToken: $nextToken) {
    jobs {
      jobId
      name
      description
      createdAt
      updatedAt
      s3Uri
      executionArn
      codebuildArn
      kb {
        label
        value
        __typename
      }
      model {
        label
        value
        __typename
      }
      agentcoreId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListJobsQueryVariables, APITypes.ListJobsQuery>;
export const describeExecution = /* GraphQL */ `query DescribeExecution($executionArn: String!) {
  describeExecution(executionArn: $executionArn)
}
` as GeneratedQuery<
  APITypes.DescribeExecutionQueryVariables,
  APITypes.DescribeExecutionQuery
>;
export const listKnowledgeBases = /* GraphQL */ `query ListKnowledgeBases {
  listKnowledgeBases {
    knowledgeBaseSummaries {
      description
      knowledgeBaseId
      name
      status
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListKnowledgeBasesQueryVariables,
  APITypes.ListKnowledgeBasesQuery
>;
export const listInferenceProfiles = /* GraphQL */ `query ListInferenceProfiles {
  listInferenceProfiles {
    inferenceProfileSummaries {
      createdAt
      description
      inferenceProfileArn
      inferenceProfileId
      inferenceProfileName
      models
      status
      type
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListInferenceProfilesQueryVariables,
  APITypes.ListInferenceProfilesQuery
>;
export const getDashboardMetrics = /* GraphQL */ `query GetDashboardMetrics {
  getDashboardMetrics {
    jobs {
      ItemCount
      ItemCountLastWeek
      TableSizeBytes
      TableSizeBytesLastWeek
      __typename
    }
    sfnAssessments {
      ExecutionsStartedLastWeek
      __typename
    }
    totalKbs
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetDashboardMetricsQueryVariables,
  APITypes.GetDashboardMetricsQuery
>;
