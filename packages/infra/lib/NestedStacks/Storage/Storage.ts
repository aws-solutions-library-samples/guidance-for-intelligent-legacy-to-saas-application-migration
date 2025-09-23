import * as cdk from "aws-cdk-lib";

import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

import { Construct } from "constructs";

export class Storage extends Construct {
  readonly uiStorageBucket: s3.Bucket;
  readonly amplifyStagingBucket: s3.Bucket;
  readonly cpArtifactBucket: s3.Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const { stackName, region, account } = cdk.Stack.of(this);

    const uniqueHash = `${stackName.toLowerCase()}-${region}-${account}`;

    const serverAccessLogsBucket = new s3.Bucket(this, "Access Logs", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: `${uniqueHash}-access-logs`,
      autoDeleteObjects: true,
      enforceSSL: true,
    });

    this.uiStorageBucket = new s3.Bucket(this, "UI Storage", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: `${uniqueHash}-ui-storage`,
      autoDeleteObjects: true,
      serverAccessLogsBucket,
      enforceSSL: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.HEAD,
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          exposedHeaders: [
            "last-modified",
            "content-type",
            "content-length",
            "etag",
            "x-amz-version-id",
            "x-amz-request-id",
            "x-amz-id-2",
            "x-amz-cf-id",
            "x-amz-storage-class",
            "date",
            "access-control-expose-headers",
          ],
        },
      ],
    });

    this.amplifyStagingBucket = new s3.Bucket(this, "Amplify Staging", {
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: `${uniqueHash}-staging`,
      autoDeleteObjects: true,
      serverAccessLogsBucket,
      enforceSSL: true,
    });

    this.cpArtifactBucket = new s3.Bucket(this, "CodePipeline Artifact", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: `${uniqueHash}-artifact`,
      autoDeleteObjects: true,
      serverAccessLogsBucket,
      enforceSSL: true,
    });
  }
}
