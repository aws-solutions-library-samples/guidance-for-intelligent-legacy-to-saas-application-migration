import * as cdk from "aws-cdk-lib";

import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";

import { Construct } from "constructs";
import { NagSuppressions } from "cdk-nag";

interface IUnitResolvers {
  graphqlApi: appsync.GraphqlApi;
  ddbDs: appsync.DynamoDbDataSource;
  sfnHttpDs: appsync.HttpDataSource;
  ddbTable: dynamodb.TableV2;
  uiStorageBucket: s3.Bucket;
  vpc: ec2.Vpc;
  stepFunction: sfn.StateMachine;
  codeBuildHttpDs: appsync.HttpDataSource;
}

export class UnitResolvers extends Construct {
  readonly graphqlApi: appsync.GraphqlApi;
  readonly ddbTable: dynamodb.TableV2;
  readonly uiStorageBucket: s3.Bucket;

  readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: IUnitResolvers) {
    super(scope, id);

    const {
      graphqlApi,
      ddbDs,
      ddbTable,
      uiStorageBucket,
      vpc,
      sfnHttpDs,
      stepFunction,
      codeBuildHttpDs,
    } = props;

    this.graphqlApi = graphqlApi;
    this.ddbTable = ddbTable;
    this.uiStorageBucket = uiStorageBucket;
    this.vpc = vpc;

    /*************************************************************/
    /************************ Data Source ************************/
    /*************************************************************/

    const agentDataSource = graphqlApi.addHttpDataSource(
      "Bedrock Agent Http DS",
      `https://bedrock-agent.${cdk.Stack.of(this).region}.amazonaws.com`,
      {
        authorizationConfig: {
          signingRegion: cdk.Stack.of(this).region,
          signingServiceName: "bedrock",
        },
      }
    );
    agentDataSource.grantPrincipal.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:ListKnowledgeBases"],
        resources: [
          `arn:aws:bedrock:${cdk.Stack.of(this).region}:${
            cdk.Stack.of(this).account
          }:knowledge-base/*`,
        ],
      })
    );

    NagSuppressions.addResourceSuppressions(
      agentDataSource,
      [
        {
          id: "AwsSolutions-IAM5",
          reason: "Allow appsync functions to invoke kb apis",
          appliesTo: [
            "Resource::arn:aws:bedrock:<AWS::Region>:<AWS::AccountId>:knowledge-base/*",
          ],
        },
      ],
      true
    );

    const bedrockDataSource = graphqlApi.addHttpDataSource(
      "Bedrock Http DS",
      `https://bedrock.${cdk.Stack.of(this).region}.amazonaws.com`,
      {
        authorizationConfig: {
          signingRegion: cdk.Stack.of(this).region,
          signingServiceName: "bedrock",
        },
      }
    );
    bedrockDataSource.grantPrincipal.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:ListInferenceProfiles"],
        resources: ["*"],
      })
    );

    NagSuppressions.addResourceSuppressions(
      bedrockDataSource,
      [
        {
          id: "AwsSolutions-IAM5",
          reason: "Allow appsync functions to invoke bedrock apis",
          appliesTo: ["Resource::*"],
        },
      ],
      true
    );

    /*************************************************************/
    /************************** Queries **************************/
    /*************************************************************/

    this.createResolver("Query", "getJob", ddbDs);
    this.createResolver("Query", "listJobs", ddbDs);
    this.createResolver("Query", "describeExecution", sfnHttpDs);
    this.createResolver("Query", "listKnowledgeBases", agentDataSource);
    this.createResolver("Query", "listInferenceProfiles", bedrockDataSource);
    this.createResolver("Query", "getCodeBuild", codeBuildHttpDs);

    this.getDashboardMetrics("Query", "getDashboardMetrics", stepFunction);

    /*************************************************************/
    /************************* Mutations *************************/
    /*************************************************************/

    this.createResolver("Mutation", "createJob", ddbDs);
    this.createResolver("Mutation", "updateJob", ddbDs);

    this.deleteJob("Mutation", "deleteJob");
    this.createTool("Mutation", "createTool");
    this.createWorkflow("Mutation", "createWorkflow");

    // Add local data source for subscription publishing
    const localDs = this.graphqlApi.addNoneDataSource("Local DS");
    this.createResolver("Mutation", "publishToolCreationUpdate", localDs);
  }

  createResolver = (
    typeName: "Mutation" | "Query",
    fieldName: string,
    dataSource: appsync.BaseDataSource
  ) => {
    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      dataSource,
      fieldName,
      typeName,
    });
  };

  getDashboardMetrics = (
    typeName: "Mutation" | "Query",
    fieldName: string,
    stepFunction: sfn.StateMachine
  ) => {
    const dashboardMetricsFn = new nodejs.NodejsFunction(
      this,
      "Get Dashboard Metrics Fn",
      {
        entry: __dirname + `/${typeName}/${fieldName}/index.ts`,
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_22_X,
        vpc: this.vpc,
        initialPolicy: [
          new iam.PolicyStatement({
            actions: ["cloudwatch:GetMetricData"],
            resources: ["*"],
          }),
          new iam.PolicyStatement({
            actions: ["dynamodb:DescribeTable"],
            resources: [this.ddbTable.tableArn],
          }),
          new iam.PolicyStatement({
            actions: ["bedrock:ListKnowledgeBases"],
            resources: [
              `arn:aws:bedrock:${cdk.Stack.of(this).region}:${
                cdk.Stack.of(this).account
              }:knowledge-base/*`,
            ],
          }),
        ],
        environment: {
          tableName: this.ddbTable.tableName,
          stepFunctionArn: stepFunction.stateMachineArn,
        },
      }
    );

    const ds = this.graphqlApi.addLambdaDataSource(
      "Dashboard Metrics Ds",
      dashboardMetricsFn
    );

    this.createResolver(typeName, fieldName, ds);

    NagSuppressions.addResourceSuppressions(
      [dashboardMetricsFn, ds],
      [
        {
          id: "AwsSolutions-IAM5",
          reason:
            "Allowing the function to list KBs and access cloudwatch metrics",
        },
      ],
      true
    );
  };

  deleteJob = (typeName: "Mutation" | "Query", fieldName: string) => {
    const deleteJobFn = new nodejs.NodejsFunction(this, "Delete Job Fn", {
      entry: __dirname + `/${typeName}/${fieldName}/index.ts`,
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_22_X,
      vpc: this.vpc,
      initialPolicy: [
        new iam.PolicyStatement({
          actions: ["dynamodb:GetItem"],
          resources: [this.ddbTable.tableArn],
        }),
        new iam.PolicyStatement({
          actions: ["dynamodb:DeleteItem"],
          resources: [this.ddbTable.tableArn],
        }),
      ],
      environment: {
        tableName: this.ddbTable.tableName,
      },
    });

    const ds = this.graphqlApi.addLambdaDataSource(
      "Delete Job Ds",
      deleteJobFn
    );

    this.createResolver(typeName, fieldName, ds);

    NagSuppressions.addResourceSuppressions(
      ds,
      [
        {
          id: "AwsSolutions-IAM5",
          reason: "Allowing the function to invoke lambda",
        },
      ],
      true
    );
  };

  createWorkflow = (typeName: "Mutation" | "Query", fieldName: string) => {
    const createWorkflow = new nodejs.NodejsFunction(this, "Create Workflow", {
      entry: __dirname + `/${typeName}/${fieldName}/index.ts`,
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(5),
      bundling: {
        commandHooks: {
          beforeInstall: () => [],
          beforeBundling: () => [],
          afterBundling(inputDir, outputDir) {
            return [`cp -r ${inputDir}/workflow_template ${outputDir}`];
          },
        },
      },
      initialPolicy: [
        // new iam.PolicyStatement({
        //   actions: [
        //     "bedrock:InvokeModel",
        //     "bedrock:InvokeModelWithResponseStream",
        //   ],
        //   resources: ["*"],
        // }),
        // new iam.PolicyStatement({
        //   actions: ["appsync:GraphQL"],
        //   resources: [`${this.graphqlApi.arn}/*`],
        // }),
        new iam.PolicyStatement({
          actions: ["s3:PutObject"],
          resources: [this.uiStorageBucket.arnForObjects(`jobs/*`)],
        }),
      ],
      environment: {
        S3_BUCKET_NAME: this.uiStorageBucket.bucketName,
      },
    });

    const ds = this.graphqlApi.addLambdaDataSource(
      "Create Workflow Ds",
      createWorkflow
    );

    this.createResolver(typeName, fieldName, ds);

    NagSuppressions.addResourceSuppressions(
      [ds, createWorkflow],
      [
        {
          id: "AwsSolutions-IAM5",
          reason: "Allowing the function to invoke lambda",
        },
      ],
      true
    );
  };

  createTool = (typeName: "Mutation" | "Query", fieldName: string) => {
    const createTool = new lambda.DockerImageFunction(this, "Create Tool Fn", {
      code: lambda.DockerImageCode.fromImageAsset(
        __dirname + `/${typeName}/${fieldName}`
      ),
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.minutes(5),
      environment: {
        APPSYNC_ENDPOINT: this.graphqlApi.graphqlUrl,
        S3_BUCKET_NAME: this.uiStorageBucket.bucketName,
      },
      initialPolicy: [
        new iam.PolicyStatement({
          actions: [
            "bedrock:InvokeModel",
            "bedrock:InvokeModelWithResponseStream",
          ],
          resources: ["*"],
        }),
        new iam.PolicyStatement({
          actions: ["appsync:GraphQL"],
          resources: [`${this.graphqlApi.arn}/*`],
        }),
        new iam.PolicyStatement({
          actions: ["s3:PutObject", "s3:GetObject"],
          resources: [this.uiStorageBucket.arnForObjects(`jobs/*`)],
        }),
      ],
    });

    const ds = this.graphqlApi.addLambdaDataSource(
      "Create Tool Ds",
      createTool
    );

    this.createResolver(typeName, fieldName, ds);

    NagSuppressions.addResourceSuppressions(
      [ds, createTool],
      [
        {
          id: "AwsSolutions-IAM5",
          reason: "Allowing the function to invoke lambda",
        },
      ],
      true
    );
  };
}
