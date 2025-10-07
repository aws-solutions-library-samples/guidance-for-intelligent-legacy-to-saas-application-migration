import * as cdk from "aws-cdk-lib";

import * as cb from "aws-cdk-lib/aws-codebuild";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import * as kms from "aws-cdk-lib/aws-kms";
import * as s3 from "aws-cdk-lib/aws-s3";

import { NagSuppressions } from "cdk-nag";

import { Construct } from "constructs";

interface ICodeBuild {
  uiStorageBucket: s3.Bucket;
  ddbTable: ddb.TableV2;
}

export class CodeBuild extends Construct {
  readonly codeBuildProject: cb.Project;
  readonly ecrRepository: ecr.Repository;
  readonly taskRole: iam.Role;

  constructor(scope: Construct, id: string, props: ICodeBuild) {
    super(scope, id);

    const { uiStorageBucket, ddbTable } = props;

    const { stackName, region, account } = cdk.Stack.of(this);

    this.ecrRepository = new ecr.Repository(this, "ECR Repository", {
      repositoryName: stackName.toLowerCase(),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          maxImageCount: 10,
        },
      ],
    });

    const agentcoreExecutionRole = new iam.Role(this, "Agentcore Role", {
      assumedBy: new iam.ServicePrincipal("bedrock-agentcore.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccessV2"),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "BedrockAgentCoreFullAccess"
        ),
      ],
      inlinePolicies: {
        Permissions: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer"],
              resources: [`arn:aws:ecr:${region}:${account}:repository/*`],
            }),
            new iam.PolicyStatement({
              actions: ["ecr:GetAuthorizationToken"],
              resources: ["*"],
            }),
            new iam.PolicyStatement({
              actions: ["bedrock-agentcore:InvokeAgentRuntime"],
              resources: [
                `arn:aws:bedrock-agentcore:${region}:${account}:runtime/*`,
              ],
            }),
            new iam.PolicyStatement({
              actions: [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream",
                "bedrock:ApplyGuardrail",
              ],
              resources: [
                "arn:aws:bedrock:*::foundation-model/*",
                `arn:aws:bedrock:${region}:${account}:*`,
              ],
            }),
          ],
        }),
      },
    });
    uiStorageBucket.grantReadWrite(agentcoreExecutionRole);

    this.codeBuildProject = new cb.Project(this, "CodeBuild Project", {
      projectName: `${stackName}-Deployment`,
      encryptionKey: new kms.Key(this, "CodeBuild", {
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        enableKeyRotation: true,
      }),
      environment: {
        buildImage: cb.LinuxArmBuildImage.AMAZON_LINUX_2023_STANDARD_3_0,
        computeType: cb.ComputeType.SMALL,
        privileged: true,
        environmentVariables: {
          AWS_DEFAULT_REGION: {
            value: region,
          },
          AWS_ACCOUNT_ID: {
            value: account,
          },
          IMAGE_REPO_NAME: {
            value: this.ecrRepository.repositoryName,
          },
          S3_BUCKET: {
            value: uiStorageBucket.bucketName,
          },
          DDB_TABLE_NAME: {
            value: ddbTable.tableName,
          },
          AGENTCORE_ROLE_ARN: {
            value: agentcoreExecutionRole.roleArn,
          },
        },
      },
      buildSpec: cb.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          install: {
            commands: [
              "curl https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip -o awscliv2.zip",
              "unzip awscliv2.zip",
              "sudo ./aws/install --update",
            ],
          },
          pre_build: {
            commands: [
              "aws s3 cp s3://$S3_BUCKET/jobs/$JOB_ID/code/ . --recursive",
              "aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com",
            ],
          },
          build: {
            commands: [
              `docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG --build-arg AWS_DEFAULT_REGION=${region} .`,
              "docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG",
            ],
          },
          post_build: {
            commands: [
              "docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG",

              // Retrieve job record from DynamoDB to check agentcore_id
              "echo 'Checking DynamoDB for existing agentcore_id...'",
              `JOB_RECORD=$(aws dynamodb get-item --table-name $DDB_TABLE_NAME --key '{"jobId": {"S": "'$JOB_ID'"}}')`,
              'echo "Job record: $JOB_RECORD"',

              // Extract agentcore_id from the response
              `AGENTCORE_ID=$(echo $JOB_RECORD | jq -r '.Item.agentcoreId.S')`,
              'echo "Found agentcore_id: $AGENTCORE_ID"',

              // Conditional logic based on agentcore_id presence
              `if [ -n "$AGENTCORE_ID" ] && [ "$AGENTCORE_ID" != "null" ]; then
                  echo "Agentcore ID exists: $AGENTCORE_ID - Running update-agent-runtime"
                  aws bedrock-agentcore-control update-agent-runtime \
                      --agent-runtime-id "$AGENTCORE_ID" \
                      --agent-runtime-artifact containerConfiguration={containerUri=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG} \
                      --role-arn $AGENTCORE_ROLE_ARN \
                      --environment-variables S3_BUCKET_NAME=$S3_BUCKET \
                      --network-configuration networkMode=PUBLIC
              else
                  echo "No agentcore_id found - Running create-agent-runtime"
                  RUNTIME_NAME=$(echo $JOB_ID | tr '-' '_')

                  if CREATED_RUNTIME=$(aws bedrock-agentcore-control create-agent-runtime \
                                        --agent-runtime-name $RUNTIME_NAME \
                                        --agent-runtime-artifact containerConfiguration={containerUri=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG} \
                                        --role-arn $AGENTCORE_ROLE_ARN \
                                        --environment-variables S3_BUCKET_NAME=$S3_BUCKET \
                                        --network-configuration networkMode=PUBLIC); then
                      echo "Created runtime: $CREATED_RUNTIME"
                  else
                      echo "Error: Failed to create agent runtime" >&2
                      exit 1
                  fi
                  AGENTCORE_ID=$(echo "$CREATED_RUNTIME" | jq -r '.agentRuntimeId')
              fi`,

              'echo "Updating DynamoDB with agentcoreId: $AGENTCORE_ID"',
              `aws dynamodb update-item \
                  --table-name $DDB_TABLE_NAME \
                  --key '{"jobId": {"S": "'$JOB_ID'"}}' \
                  --update-expression "SET agentcoreId = :agentcoreId" \
                  --expression-attribute-values '{":agentcoreId": {"S": "'$AGENTCORE_ID'"}}'`,
            ],
          },
        },
      }),
    });

    this.ecrRepository.grantPullPush(this.codeBuildProject.grantPrincipal);
    ddbTable.grantReadWriteData(this.codeBuildProject.grantPrincipal);
    uiStorageBucket.grantRead(this.codeBuildProject);

    this.codeBuildProject.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
        ],
        resources: ["*"],
      })
    );

    this.codeBuildProject.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["*"],
        resources: ["*"],
      })
    );

    NagSuppressions.addResourceSuppressions(
      [this.codeBuildProject, agentcoreExecutionRole],
      [
        {
          id: "AwsSolutions-IAM5",
          reason: "Wilcard access is required for triggering this pipeline",
        },
      ],
      true
    );

    NagSuppressions.addResourceSuppressions(
      agentcoreExecutionRole,
      [
        {
          id: "AwsSolutions-IAM4",
          reason: "Task role requires wildcard to invoke bedrock agentcore",
        },
      ],
      true
    );
  }
}
