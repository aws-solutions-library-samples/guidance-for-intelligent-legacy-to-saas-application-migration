/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateJobInput = {
  jobId?: string | null,
  name?: string | null,
  description?: string | null,
};

export type Job = {
  __typename: "Job",
  jobId: string,
  name?: string | null,
  description?: string | null,
  createdAt: string,
  updatedAt: string,
  s3Uri?: string | null,
  executionArn?: string | null,
  codebuildArn?: string | null,
  kb?: Select | null,
  model?: Select | null,
  agentcoreId?: string | null,
  column?: DbbCategory | null,
  row?: DbbCategory | null,
};

export type Select = {
  __typename: "Select",
  label: string,
  value: string,
};

export type DbbCategory = {
  __typename: "DbbCategory",
  L?:  Array<StringSet | null > | null,
};

export type StringSet = {
  __typename: "StringSet",
  SS?: Array< string | null > | null,
};

export type UpdateJobInput = {
  jobId?: string | null,
  name?: string | null,
  description?: string | null,
  s3Uri?: string | null,
  kb?: SelectInput | null,
  model?: SelectInput | null,
};

export type SelectInput = {
  label?: string | null,
  value?: string | null,
};

export type CreateWorkflowInput = {
  jobId?: string | null,
  agents?: Array< Agents | null > | null,
  rowCategories?: Array< Category | null > | null,
  columnCategories?: Array< Category | null > | null,
};

export type Agents = {
  systemPrompt?: string | null,
};

export type Category = {
  name?: string | null,
  description?: string | null,
};

export type ToolCreationUpdateInput = {
  jobId: string,
  type: string,
  message: string,
  eventId: string,
};

export type ToolCreationUpdate = {
  __typename: "ToolCreationUpdate",
  jobId: string,
  type: string,
  message: string,
  eventId: string,
};

export type DashboardMetrics = {
  __typename: "DashboardMetrics",
  jobs?: JobMetrics | null,
  sfnAssessments?: AssessmentMetrics | null,
  totalKbs?: number | null,
};

export type JobMetrics = {
  __typename: "JobMetrics",
  ItemCount?: number | null,
  ItemCountLastWeek?: number | null,
  TableSizeBytes?: number | null,
  TableSizeBytesLastWeek?: number | null,
};

export type AssessmentMetrics = {
  __typename: "AssessmentMetrics",
  ExecutionsStartedLastWeek?: number | null,
};

export type KnowledgeBaseConnection = {
  __typename: "KnowledgeBaseConnection",
  knowledgeBaseSummaries?:  Array<KnowledgeBaseSummary > | null,
  nextToken?: string | null,
};

export type KnowledgeBaseSummary = {
  __typename: "KnowledgeBaseSummary",
  description?: string | null,
  knowledgeBaseId?: string | null,
  name?: string | null,
  status?: string | null,
  updatedAt: string,
};

export type JobConnection = {
  __typename: "JobConnection",
  jobs?:  Array<Job > | null,
  nextToken?: string | null,
};

export type CodeBuildDetails = {
  __typename: "CodeBuildDetails",
  id?: string | null,
  projectName?: string | null,
  logs?: string | null,
  buildStatus?: string | null,
};

export type DescribeExecution = {
  __typename: "DescribeExecution",
  status?: string | null,
  error?: string | null,
  cause?: string | null,
  buildStatus?: string | null,
};

export type InferenceProfileConnection = {
  __typename: "InferenceProfileConnection",
  inferenceProfileSummaries?:  Array<InferenceProfile > | null,
  nextToken?: string | null,
};

export type InferenceProfile = {
  __typename: "InferenceProfile",
  createdAt?: string | null,
  description?: string | null,
  inferenceProfileArn?: string | null,
  inferenceProfileId?: string | null,
  inferenceProfileName?: string | null,
  models?: Array< string | null > | null,
  status?: string | null,
  type?: string | null,
  updatedAt?: string | null,
};

export type CreateJobMutationVariables = {
  input: CreateJobInput,
};

export type CreateJobMutation = {
  createJob?:  {
    __typename: "Job",
    jobId: string,
    name?: string | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
    s3Uri?: string | null,
    executionArn?: string | null,
    codebuildArn?: string | null,
    kb?:  {
      __typename: "Select",
      label: string,
      value: string,
    } | null,
    model?:  {
      __typename: "Select",
      label: string,
      value: string,
    } | null,
    agentcoreId?: string | null,
    column?:  {
      __typename: "DbbCategory",
      L?:  Array< {
        __typename: "StringSet",
        SS?: Array< string | null > | null,
      } | null > | null,
    } | null,
    row?:  {
      __typename: "DbbCategory",
      L?:  Array< {
        __typename: "StringSet",
        SS?: Array< string | null > | null,
      } | null > | null,
    } | null,
  } | null,
};

export type UpdateJobMutationVariables = {
  input: UpdateJobInput,
};

export type UpdateJobMutation = {
  updateJob?:  {
    __typename: "Job",
    jobId: string,
    name?: string | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
    s3Uri?: string | null,
    executionArn?: string | null,
    codebuildArn?: string | null,
    kb?:  {
      __typename: "Select",
      label: string,
      value: string,
    } | null,
    model?:  {
      __typename: "Select",
      label: string,
      value: string,
    } | null,
    agentcoreId?: string | null,
    column?:  {
      __typename: "DbbCategory",
      L?:  Array< {
        __typename: "StringSet",
        SS?: Array< string | null > | null,
      } | null > | null,
    } | null,
    row?:  {
      __typename: "DbbCategory",
      L?:  Array< {
        __typename: "StringSet",
        SS?: Array< string | null > | null,
      } | null > | null,
    } | null,
  } | null,
};

export type DeleteJobMutationVariables = {
  jobId: string,
};

export type DeleteJobMutation = {
  deleteJob?:  {
    __typename: "Job",
    jobId: string,
    name?: string | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
    s3Uri?: string | null,
    executionArn?: string | null,
    codebuildArn?: string | null,
    kb?:  {
      __typename: "Select",
      label: string,
      value: string,
    } | null,
    model?:  {
      __typename: "Select",
      label: string,
      value: string,
    } | null,
    agentcoreId?: string | null,
    column?:  {
      __typename: "DbbCategory",
      L?:  Array< {
        __typename: "StringSet",
        SS?: Array< string | null > | null,
      } | null > | null,
    } | null,
    row?:  {
      __typename: "DbbCategory",
      L?:  Array< {
        __typename: "StringSet",
        SS?: Array< string | null > | null,
      } | null > | null,
    } | null,
  } | null,
};

export type CreateWorkflowMutationVariables = {
  input?: CreateWorkflowInput | null,
};

export type CreateWorkflowMutation = {
  createWorkflow?: string | null,
};

export type StartDeploymentMutationVariables = {
  jobId?: string | null,
};

export type StartDeploymentMutation = {
  startDeployment?: string | null,
};

export type CreateToolMutationVariables = {
  jobId?: string | null,
  prompt?: string | null,
  loadHistory?: boolean | null,
  saveTools?: boolean | null,
};

export type CreateToolMutation = {
  createTool?: string | null,
};

export type PublishToolCreationUpdateMutationVariables = {
  input: ToolCreationUpdateInput,
};

export type PublishToolCreationUpdateMutation = {
  publishToolCreationUpdate?:  {
    __typename: "ToolCreationUpdate",
    jobId: string,
    type: string,
    message: string,
    eventId: string,
  } | null,
};

export type StartAssessmentMutationVariables = {
  jobId?: string | null,
  streaming?: boolean | null,
};

export type StartAssessmentMutation = {
  startAssessment?: string | null,
};

export type GetDashboardMetricsQueryVariables = {
};

export type GetDashboardMetricsQuery = {
  getDashboardMetrics?:  {
    __typename: "DashboardMetrics",
    jobs?:  {
      __typename: "JobMetrics",
      ItemCount?: number | null,
      ItemCountLastWeek?: number | null,
      TableSizeBytes?: number | null,
      TableSizeBytesLastWeek?: number | null,
    } | null,
    sfnAssessments?:  {
      __typename: "AssessmentMetrics",
      ExecutionsStartedLastWeek?: number | null,
    } | null,
    totalKbs?: number | null,
  } | null,
};

export type ListKnowledgeBasesQueryVariables = {
};

export type ListKnowledgeBasesQuery = {
  listKnowledgeBases?:  {
    __typename: "KnowledgeBaseConnection",
    knowledgeBaseSummaries?:  Array< {
      __typename: "KnowledgeBaseSummary",
      description?: string | null,
      knowledgeBaseId?: string | null,
      name?: string | null,
      status?: string | null,
      updatedAt: string,
    } > | null,
    nextToken?: string | null,
  } | null,
};

export type ListJobsQueryVariables = {
  limit?: number | null,
  nextToken?: string | null,
};

export type ListJobsQuery = {
  listJobs?:  {
    __typename: "JobConnection",
    jobs?:  Array< {
      __typename: "Job",
      jobId: string,
      name?: string | null,
      description?: string | null,
      createdAt: string,
      updatedAt: string,
      s3Uri?: string | null,
      executionArn?: string | null,
      codebuildArn?: string | null,
      kb?:  {
        __typename: "Select",
        label: string,
        value: string,
      } | null,
      model?:  {
        __typename: "Select",
        label: string,
        value: string,
      } | null,
      agentcoreId?: string | null,
      column?:  {
        __typename: "DbbCategory",
      } | null,
      row?:  {
        __typename: "DbbCategory",
      } | null,
    } > | null,
    nextToken?: string | null,
  } | null,
};

export type GetJobQueryVariables = {
  jobId?: string | null,
};

export type GetJobQuery = {
  getJob?:  {
    __typename: "Job",
    jobId: string,
    name?: string | null,
    description?: string | null,
    createdAt: string,
    updatedAt: string,
    s3Uri?: string | null,
    executionArn?: string | null,
    codebuildArn?: string | null,
    kb?:  {
      __typename: "Select",
      label: string,
      value: string,
    } | null,
    model?:  {
      __typename: "Select",
      label: string,
      value: string,
    } | null,
    agentcoreId?: string | null,
    column?:  {
      __typename: "DbbCategory",
      L?:  Array< {
        __typename: "StringSet",
        SS?: Array< string | null > | null,
      } | null > | null,
    } | null,
    row?:  {
      __typename: "DbbCategory",
      L?:  Array< {
        __typename: "StringSet",
        SS?: Array< string | null > | null,
      } | null > | null,
    } | null,
  } | null,
};

export type GetCodeBuildQueryVariables = {
  codebuildArn?: string | null,
};

export type GetCodeBuildQuery = {
  getCodeBuild?:  {
    __typename: "CodeBuildDetails",
    id?: string | null,
    projectName?: string | null,
    logs?: string | null,
    buildStatus?: string | null,
  } | null,
};

export type DescribeExecutionQueryVariables = {
  executionArn: string,
};

export type DescribeExecutionQuery = {
  describeExecution?:  {
    __typename: "DescribeExecution",
    status?: string | null,
    error?: string | null,
    cause?: string | null,
    buildStatus?: string | null,
  } | null,
};

export type ListInferenceProfilesQueryVariables = {
};

export type ListInferenceProfilesQuery = {
  listInferenceProfiles?:  {
    __typename: "InferenceProfileConnection",
    inferenceProfileSummaries?:  Array< {
      __typename: "InferenceProfile",
      createdAt?: string | null,
      description?: string | null,
      inferenceProfileArn?: string | null,
      inferenceProfileId?: string | null,
      inferenceProfileName?: string | null,
      models?: Array< string | null > | null,
      status?: string | null,
      type?: string | null,
      updatedAt?: string | null,
    } > | null,
    nextToken?: string | null,
  } | null,
};

export type OnToolCreationUpdateSubscriptionVariables = {
  jobId: string,
};

export type OnToolCreationUpdateSubscription = {
  onToolCreationUpdate?:  {
    __typename: "ToolCreationUpdate",
    jobId: string,
    type: string,
    message: string,
    eventId: string,
  } | null,
};
