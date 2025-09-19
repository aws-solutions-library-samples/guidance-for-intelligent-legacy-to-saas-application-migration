import * as cdk from "aws-cdk-lib";

import * as identity from "aws-cdk-lib/aws-cognito-identitypool";
import * as actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as amplify from "@aws-cdk/aws-amplify-alpha";
import * as s3Assets from "aws-cdk-lib/aws-s3-assets";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cp from "aws-cdk-lib/aws-codepipeline";
import * as cb from "aws-cdk-lib/aws-codebuild";
import * as iam from "aws-cdk-lib/aws-iam";
import * as kms from "aws-cdk-lib/aws-kms";
import * as s3 from "aws-cdk-lib/aws-s3";

import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";

interface AmplifyProps {
  userPoolClient: cognito.UserPoolClient;
  identityPool: identity.IdentityPool;
  amplifyStagingBucket: s3.Bucket;
  graphqlApi: appsync.GraphqlApi;
  cpArtifactBucket: s3.Bucket;
  uiStorageBucket: s3.Bucket;
  userPool: cognito.UserPool;
}

export class Amplify extends Construct {
  readonly newBranch: amplify.Branch;

  constructor(scope: Construct, id: string, props: AmplifyProps) {
    super(scope, id);

    const {
      amplifyStagingBucket,
      cpArtifactBucket,
      uiStorageBucket,
      userPoolClient,
      identityPool,
      graphqlApi,
      userPool,
    } = props;

    const stack = cdk.Stack.of(this);

    /***********************************************************************/
    /**************************** Amplify App ******************************/
    /***********************************************************************/

    const mimeTypes = [
      "css",
      "js",
      "txt",
      "woff",
      "woff2",
      "ttf",
      "svg",
      "json",
    ];

    const amplifyApp = new amplify.App(this, stack.stackName, {
      customRules: [
        new amplify.CustomRule({
          source: `</^[^.]+$|\\.(?!(${mimeTypes.join("|")})$)([^.]+$)/>`,
          target: "/index.html",
          status: amplify.RedirectStatus.REWRITE,
        }),
      ],
    });

    const project = new cb.PipelineProject(this, "Build App", {
      projectName: stack.stackName,
      encryptionKey: new kms.Key(this, "Build App Key", {
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        enableKeyRotation: true,
      }),
      environment: {
        buildImage: cb.LinuxArmBuildImage.AMAZON_LINUX_2023_STANDARD_3_0,
        computeType: cb.ComputeType.SMALL,
      },
    });
    project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject", "s3:GetObjectAcl", "s3:PutObjectAcl"],
        resources: [`${amplifyStagingBucket.arnForObjects("*")}`],
      })
    );
    project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["amplify:StartDeployment"],
        resources: [`${amplifyApp.arn}/branches/main/deployments/start`],
      })
    );

    const webappAsset = new s3Assets.Asset(this, "WebApp Code Asset", {
      path: "../../packages/webapp",
      exclude: [
        "node_modules",
        ".env",
        "dist",
        ".git",
        ".DS_Store",
        "public/ace",
      ],
    });

    const webappArtifact = new cp.Artifact();

    const pipeline = new cp.Pipeline(this, "Build and Deploy Amplify App", {
      artifactBucket: cpArtifactBucket,
      pipelineName: stack.stackName,
      stages: [
        {
          stageName: "Source",
          actions: [
            new actions.S3SourceAction({
              actionName: "react-webapp-code",
              bucket: webappAsset.bucket,
              bucketKey: webappAsset.s3ObjectKey,
              output: webappArtifact,
            }),
          ],
        },
        {
          stageName: "BuildApp",
          actions: [
            new actions.CodeBuildAction({
              actionName: "deploy-to-amplify",
              input: webappArtifact,
              project,
              environmentVariables: {
                BUILD_BUCKET: {
                  value: amplifyStagingBucket.s3UrlForObject(),
                },
                BRANCH_NAME: { value: "main" },
                REGION: { value: stack.region },
                APP_ID: { value: amplifyApp.appId },
                APPSYNC_API: { value: graphqlApi.graphqlUrl },
                USER_POOL_ID: { value: userPool.userPoolId },
                STORAGE_BUCKET: { value: uiStorageBucket.bucketName },
                IDENTITY_POOL_ID: { value: identityPool.identityPoolId },
                USER_POOL_CLIENT_ID: { value: userPoolClient.userPoolClientId },
              },
            }),
          ],
        },
      ],
    });
    webappAsset.grantRead(pipeline.role);

    NagSuppressions.addResourceSuppressions(
      [pipeline, project],
      [
        {
          id: "AwsSolutions-IAM5",
          reason:
            "Codepipeline & CodeBuild require wildcard access to build artifacts",
        },
      ],
      true
    );

    this.newBranch = amplifyApp.addBranch("main");
  }
}
