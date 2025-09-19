import * as cdk from "aws-cdk-lib";

import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as logs from "aws-cdk-lib/aws-logs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";

import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";

interface IStepFunction {
  ddbTable: ddb.TableV2;
  uiStorageBucket: s3.Bucket;
}

export class StepFunction extends Construct {
  public readonly stepFunction: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: IStepFunction) {
    super(scope, id);

    const stack = cdk.Stack.of(this);

    const { ddbTable } = props;

    /********************************************************************/
    /****************************** getJob ******************************/
    /********************************************************************/

    const getJob = tasks.DynamoGetItem.jsonata(this, "Get Job", {
      key: {
        jobId: tasks.DynamoAttributeValue.fromString(
          "{% $states.input.jobId %}"
        ),
      },
      table: ddbTable,
      assign: {
        jobId: "{% $states.input.jobId %}",
        streaming: "{% $states.input.streaming %}",
        s3Uri: "{% $states.result.Item.s3Uri.S %}",
        kbId: "{% $states.result.Item.kb.M.value.S %}",
        modelId: "{% $states.result.Item.model.M.value.S %}",
        agentcoreId: "{% $states.result.Item.agentcoreId.S %}",
      },
    });

    /********************************************************************/
    /***************************** runTask ******************************/
    /********************************************************************/

    const triggerFn = new nodejs.NodejsFunction(this, "Trigger AgentCore Fn", {
      entry: __dirname + "/invokeAgentCore/index.ts",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(30),
      initialPolicy: [
        new iam.PolicyStatement({
          actions: ["bedrock-agentcore:InvokeAgentRuntime"],
          resources: [
            `arn:aws:bedrock-agentcore:${stack.region}:${stack.account}:runtime/*`,
          ],
        }),
      ],
    });

    const invokeAgent = tasks.LambdaInvoke.jsonata(this, "Invoke AgentCore", {
      lambdaFunction: triggerFn,
      payloadResponseOnly: true,
      payload: sfn.TaskInput.fromObject({
        agentcoreId: "{% $agentcoreId %}",
      }),
    });

    /************************************************************************/
    /************************** Step Function *******************************/
    /************************************************************************/

    const sfnRole = new iam.Role(this, "Step Function Role", {
      assumedBy: new iam.ServicePrincipal("states.amazonaws.com"),
    });

    const definition = getJob.next(invokeAgent);

    this.stepFunction = new sfn.StateMachine(this, "Start Assessment Sfn", {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      stateMachineName: stack.stackName,
      tracingEnabled: true,

      logs: {
        level: sfn.LogLevel.ALL,
        destination: new logs.LogGroup(this, "SF LogGroup"),
      },
    });

    NagSuppressions.addResourceSuppressions(
      [this.stepFunction, sfnRole, triggerFn],
      [
        {
          id: "AwsSolutions-IAM5",
          reason:
            "Granting step functions and roles ability to leverage wildcard to call services.",
        },
      ],
      true
    );
  }
}
