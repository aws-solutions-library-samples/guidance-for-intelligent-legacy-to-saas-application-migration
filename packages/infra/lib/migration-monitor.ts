import * as cdk from "aws-cdk-lib";

import { Authentication } from "./NestedStacks/Authentication/Authentication";
import { StepFunction } from "./NestedStacks/StepFunction/StepFunction";
import { CodeBuild } from "./NestedStacks/CodeBuild/CodeBuild";
import { DynamoDB } from "./NestedStacks/DynamoDB/DynamoDB";
import { Amplify } from "./NestedStacks/Amplify/Amplify";
import { Storage } from "./NestedStacks/Storage/Storage";
import { AppSync } from "./NestedStacks/AppSync/AppSync";
import { Network } from "./NestedStacks/Network/Network";

import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";

export class MigrationMonitor extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /********************************************************************/
    /***************************** Storage ******************************/
    /********************************************************************/

    const storageStack = new Storage(this, "Storage");

    /********************************************************************/
    /***************************** Network ******************************/
    /********************************************************************/

    const networkStack = new Network(this, "Network");

    /********************************************************************/
    /***************************** DynamoDB ******************************/
    /********************************************************************/

    const dynamoDbStack = new DynamoDB(this, "DynamoDB", {
      vpc: networkStack.vpc,
    });

    /********************************************************************/
    /************************* Authentication ***************************/
    /********************************************************************/

    const authStack = new Authentication(this, "Authentication", {
      uiStorageBucket: storageStack.uiStorageBucket,
    });

    /********************************************************************/
    /**************************** CodeBuild *****************************/
    /********************************************************************/

    const codeBuildStack = new CodeBuild(this, "CodeBuild", {
      uiStorageBucket: storageStack.uiStorageBucket,
      ddbTable: dynamoDbStack.ddbTable,
    });

    /********************************************************************/
    /************************** Step Function ***************************/
    /********************************************************************/

    const stepFnStack = new StepFunction(this, "StepFunction", {
      ddbTable: dynamoDbStack.ddbTable,
      uiStorageBucket: storageStack.uiStorageBucket,
    });

    /********************************************************************/
    /***************************** AppSync ******************************/
    /********************************************************************/

    const appsyncStack = new AppSync(this, "AppSync", {
      uiStorageBucket: storageStack.uiStorageBucket,
      stepFunction: stepFnStack.stepFunction,
      ddbTable: dynamoDbStack.ddbTable,
      userPool: authStack.userPool,
      vpc: networkStack.vpc,
      codeBuildProject: codeBuildStack.codeBuildProject,
    });

    /********************************************************************/
    /***************************** Amplify ******************************/
    /********************************************************************/

    new Amplify(this, "Amplify", {
      amplifyStagingBucket: storageStack.amplifyStagingBucket,
      cpArtifactBucket: storageStack.cpArtifactBucket,
      uiStorageBucket: storageStack.uiStorageBucket,
      userPoolClient: authStack.userPoolClient,
      identityPool: authStack.identityPool,
      graphqlApi: appsyncStack.graphqlApi,
      userPool: authStack.userPool,
    });

    /********************************************************************/
    /***************************** Outputs ******************************/
    /********************************************************************/

    new cdk.CfnOutput(this, "VITE_USERPOOLID", {
      value: authStack.userPool.userPoolId,
    });
    new cdk.CfnOutput(this, "VITE_USERPOOLCLIENTID", {
      value: authStack.userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, "VITE_IDENTITYPOOLID", {
      value: authStack.identityPool.identityPoolId,
    });
    new cdk.CfnOutput(this, "VITE_APPSYNCAPI", {
      value: appsyncStack.graphqlApi.graphqlUrl,
    });
    new cdk.CfnOutput(this, "VITE_REGION", {
      value: this.region,
    });
    new cdk.CfnOutput(this, "VITE_UISTORAGEBUCKET", {
      value: storageStack.uiStorageBucket.bucketName,
    });

    NagSuppressions.addStackSuppressions(this, [
      {
        id: "AwsSolutions-IAM4",
        reason:
          "Basic AWS managed policy applied to each Lambda to enable basic logging",
        appliesTo: [
          "Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          "Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        ],
      },
    ]);

    NagSuppressions.addResourceSuppressionsByPath(
      this,
      [
        `/${this.stackName}/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy/Resource`,
        `/${this.stackName}/Custom::CDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C/ServiceRole/DefaultPolicy/Resource`,
      ],
      [
        {
          id: "AwsSolutions-IAM5",
          reason:
            "Suppressing this log retention default policy and ability to upload a folder to s3",
        },
      ],
      true
    );

    NagSuppressions.addResourceSuppressionsByPath(
      this,
      `/${this.stackName}/Custom::CDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C/Resource`,
      [
        {
          id: "AwsSolutions-L1",
          reason: "Upload lambda is fixed on a version",
        },
      ],
      true
    );
  }
}
