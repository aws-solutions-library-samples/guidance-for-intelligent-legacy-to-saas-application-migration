import * as cdk from "aws-cdk-lib";

import * as targets from "aws-cdk-lib/aws-events-targets";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";

import { Construct } from "constructs";
import { NagSuppressions } from "cdk-nag";

interface IDynamoDB {
  vpc: ec2.Vpc;
}

export class DynamoDB extends Construct {
  readonly ddbTable: dynamodb.TableV2;

  constructor(scope: Construct, id: string, props: IDynamoDB) {
    super(scope, id);

    const { vpc } = props;

    this.ddbTable = new dynamodb.TableV2(this, "DynamoDB Table", {
      partitionKey: { name: "jobId", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const metricsFn = new nodejs.NodejsFunction(this, "DynamoDB Metrics Fn", {
      architecture: lambda.Architecture.ARM_64,
      entry: __dirname + "/lambda/index.ts",
      runtime: lambda.Runtime.NODEJS_22_X,
      vpc,
      initialPolicy: [
        new iam.PolicyStatement({
          actions: ["dynamodb:DescribeTable"],
          resources: [this.ddbTable.tableArn],
        }),
        new iam.PolicyStatement({
          actions: ["cloudwatch:PutMetricData"],
          resources: ["*"],
        }),
      ],
      environment: {
        tableName: this.ddbTable.tableName,
      },
    });

    new events.Rule(this, "Metrics Rule", {
      schedule: events.Schedule.rate(cdk.Duration.days(1)),
      targets: [new targets.LambdaFunction(metricsFn)],
    });

    NagSuppressions.addResourceSuppressions(
      metricsFn.role!,
      [
        {
          id: "AwsSolutions-IAM5",
          reason: "Role requires wildcard access to push metrics to cloudwatch",
          appliesTo: ["Resource::*"],
        },
      ],
      true
    );
  }
}
