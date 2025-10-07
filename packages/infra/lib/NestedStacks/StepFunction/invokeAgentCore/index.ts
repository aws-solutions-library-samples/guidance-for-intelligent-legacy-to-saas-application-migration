import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore";
import { Context } from "aws-lambda";

const client = new BedrockAgentCoreClient({});

type InvokeEvent = {
  agentcoreId: string;
};

export const handler = async (event: InvokeEvent, context: Context) => {
  const response = await client.send(
    new InvokeAgentRuntimeCommand({
      agentRuntimeArn: `arn:aws:bedrock-agentcore:${
        process.env.AWS_DEFAULT_REGION
      }:${context.invokedFunctionArn.split(":")[4]}:runtime/${
        event.agentcoreId
      }`,
      payload: Buffer.from(JSON.stringify(event)),
    })
  );

  return JSON.parse(await response.response?.transformToString()!);
};
