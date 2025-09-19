import * as cdk from "aws-cdk-lib";

import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cb from "aws-cdk-lib/aws-codebuild";
import * as iam from "aws-cdk-lib/aws-iam";

import * as path from "path";

import { Construct } from "constructs";
import { UnitResolvers } from "./Resolvers/UnitResolvers/UnitResolvers";
import { PipelineResolvers } from "./Resolvers/PipelineResolvers/PipelineResolvers";
import { NagSuppressions } from "cdk-nag";

interface AppSyncProps {
  userPool: cognito.UserPool;
  uiStorageBucket: s3.Bucket;
  ddbTable: dynamodb.TableV2;
  vpc: ec2.Vpc;
  stepFunction: sfn.StateMachine;
  codeBuildProject: cb.Project;
}

export class AppSync extends Construct {
  public readonly graphqlApi: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: AppSyncProps) {
    super(scope, id);

    const {
      userPool,
      ddbTable,
      uiStorageBucket,
      vpc,
      stepFunction,
      codeBuildProject,
    } = props;

    const stack = cdk.Stack.of(this);

    /********************************************************************/
    /***************************** AppSync ******************************/
    /********************************************************************/

    this.graphqlApi = new appsync.GraphqlApi(this, "Frontend API", {
      name: stack.stackName,
      definition: appsync.Definition.fromFile(
        path.join(__dirname, "../../../../webapp/schema.graphql")
      ),

      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: { userPool },
        },
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.IAM,
          },
        ],
      },

      xrayEnabled: true,

      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },

      environmentVariables: {
        STEP_FUNCTION_ARN: stepFunction.stateMachineArn,
        CODEBUILD_PROJECT_NAME: codeBuildProject.projectName,
      },
    });

    /********************************************************************/
    /******************************* WAF ********************************/
    /********************************************************************/

    const webAcl = new wafv2.CfnWebACL(this, "WAF", {
      defaultAction: {
        allow: {},
      },
      scope: "REGIONAL",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "MetricForWebACLCDK",
        sampledRequestsEnabled: true,
      },
    });

    new wafv2.CfnWebACLAssociation(this, "WAF Association", {
      resourceArn: this.graphqlApi.arn,
      webAclArn: webAcl.attrArn,
    });

    /********************************************************************/
    /*********************** DynamoDB Datasource ************************/
    /********************************************************************/

    const ddbDs = this.graphqlApi.addDynamoDbDataSource(
      "DynamoDB DS",
      ddbTable
    );

    /********************************************************************/
    /******************** Step Func Http Datasource *********************/
    /********************************************************************/

    const sfnHttpDs = this.graphqlApi.addHttpDataSource(
      "Step Function DS",
      `https://states.${cdk.Stack.of(this).region}.amazonaws.com`,
      {
        name: "sfnHttpDs",
        authorizationConfig: {
          signingRegion: cdk.Stack.of(this).region,
          signingServiceName: "states",
        },
      }
    );
    stepFunction.grantStartExecution(sfnHttpDs);
    stepFunction.grantRead(sfnHttpDs);

    /********************************************************************/
    /******************** Code Build Http Datasource ********************/
    /********************************************************************/

    const codeBuildHttpDs = this.graphqlApi.addHttpDataSource(
      "CodeBuild DS",
      `https://codebuild.${cdk.Stack.of(this).region}.amazonaws.com`,
      {
        name: "codeBuildHttpDs",
        authorizationConfig: {
          signingRegion: cdk.Stack.of(this).region,
          signingServiceName: "codebuild",
        },
      }
    );
    codeBuildHttpDs.grantPrincipal.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["codebuild:StartBuild", "codebuild:BatchGetBuilds"],
        resources: [codeBuildProject.projectArn],
      })
    );

    /********************************************************************/
    /************************** Unit Resolvers **************************/
    /********************************************************************/

    new UnitResolvers(this, "Unit Resolvers", {
      graphqlApi: this.graphqlApi,
      ddbDs,
      ddbTable,
      uiStorageBucket,
      vpc,
      sfnHttpDs,
      stepFunction,
      codeBuildHttpDs,
    });

    /********************************************************************/
    /************************ Pipeline Resolvers ************************/
    /********************************************************************/

    new PipelineResolvers(this, "Pipeline Resolvers", {
      graphqlApi: this.graphqlApi,
      ddbDs,
      sfnHttpDs,
      codeBuildProject,
      codeBuildHttpDs,
    });

    NagSuppressions.addResourceSuppressions(
      sfnHttpDs,
      [
        {
          id: "AwsSolutions-IAM5",
          reason: "Allow appsync to invoke stepfunctions",
        },
      ],
      true
    );

    NagSuppressions.addResourceSuppressions(
      this.graphqlApi,
      [
        {
          id: "AwsSolutions-IAM4",
          reason: "Allows appsync to push logs",
          appliesTo: [
            "Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSAppSyncPushToCloudWatchLogs",
          ],
        },
      ],
      true
    );
  }
}
