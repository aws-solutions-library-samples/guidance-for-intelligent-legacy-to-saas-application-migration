import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

const ddbClient = new DynamoDB({});
const ddbDocClient = DynamoDBDocument.from(ddbClient);

export const handler = async (event) => {
  const { jobId } = event;

  await ddbDocClient.delete({
    TableName: process.env.tableName,
    Key: { jobId },
  });
};
