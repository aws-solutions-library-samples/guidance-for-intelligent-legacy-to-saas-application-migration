/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createJob = /* GraphQL */ `mutation CreateJob($input: CreateJobInput!) {
  createJob(input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateJobMutationVariables,
  APITypes.CreateJobMutation
>;
export const updateJob = /* GraphQL */ `mutation UpdateJob($input: UpdateJobInput!) {
  updateJob(input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateJobMutationVariables,
  APITypes.UpdateJobMutation
>;
export const deleteJob = /* GraphQL */ `mutation DeleteJob($jobId: String!) {
  deleteJob(jobId: $jobId) {
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
` as GeneratedMutation<
  APITypes.DeleteJobMutationVariables,
  APITypes.DeleteJobMutation
>;
export const createTool = /* GraphQL */ `mutation CreateTool(
  $jobId: String
  $prompt: String
  $loadHistory: Boolean
  $saveTools: Boolean
) {
  createTool(
    jobId: $jobId
    prompt: $prompt
    loadHistory: $loadHistory
    saveTools: $saveTools
  )
}
` as GeneratedMutation<
  APITypes.CreateToolMutationVariables,
  APITypes.CreateToolMutation
>;
export const publishToolCreationUpdate = /* GraphQL */ `mutation PublishToolCreationUpdate($input: ToolCreationUpdateInput!) {
  publishToolCreationUpdate(input: $input) {
    jobId
    type
    message
    eventId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.PublishToolCreationUpdateMutationVariables,
  APITypes.PublishToolCreationUpdateMutation
>;
export const createWorkflow = /* GraphQL */ `mutation CreateWorkflow($input: CreateWorkflowInput) {
  createWorkflow(input: $input)
}
` as GeneratedMutation<
  APITypes.CreateWorkflowMutationVariables,
  APITypes.CreateWorkflowMutation
>;
export const startAssessment = /* GraphQL */ `mutation StartAssessment($jobId: String, $streaming: Boolean) {
  startAssessment(jobId: $jobId, streaming: $streaming)
}
` as GeneratedMutation<
  APITypes.StartAssessmentMutationVariables,
  APITypes.StartAssessmentMutation
>;
export const startDeployment = /* GraphQL */ `mutation StartDeployment($jobId: String) {
  startDeployment(jobId: $jobId)
}
` as GeneratedMutation<
  APITypes.StartDeploymentMutationVariables,
  APITypes.StartDeploymentMutation
>;
