import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import {
  BedrockAgentCoreControlClient,
  DeleteAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore-control";

const agentcoreClient = new BedrockAgentCoreControlClient({});

const ddbClient = new DynamoDB({});
const ddbDocClient = DynamoDBDocument.from(ddbClient);

interface IHandler {
  jobId: string;
}

export const handler = async (event: IHandler) => {
  const { jobId } = event;

  const { Item } = await ddbDocClient.get({
    TableName: process.env.tableName,
    Key: { jobId },
  });

  if (Item?.agentcoreId.S) {
    await agentcoreClient.send(
      new DeleteAgentRuntimeCommand({
        agentRuntimeId: Item?.agentcoreId.S,
      })
    );
  }

  await ddbDocClient.delete({
    TableName: process.env.tableName,
    Key: { jobId },
  });
};
