import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const ddbClient = new DynamoDB({});
const ddbDocClient = DynamoDBDocument.from(ddbClient);

interface IHandler {}

export const handler = async (event: IHandler) => {
  const timestamp = new Date().toISOString();
  const jobId = "job-" + uuidv4().substring(4);

  await ddbDocClient.put({
    TableName: process.env.tableName,
    Item: {
      jobId,
      createdAt: timestamp,
      updatedAt: timestamp,
      model: {
        label: "US Claude Sonnet 4",
        value: "us.anthropic.claude-sonnet-4-20250514-v1:0",
      },
      ...event,
    },
  });
};
