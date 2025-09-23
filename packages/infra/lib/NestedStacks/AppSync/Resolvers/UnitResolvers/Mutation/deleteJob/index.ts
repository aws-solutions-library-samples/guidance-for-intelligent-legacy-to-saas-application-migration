import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

const ddbClient = new DynamoDB({});
const ddbDocClient = DynamoDBDocument.from(ddbClient);

interface IHandler {
  jobId: string;
}

export const handler = async (event: IHandler) => {
  const { jobId } = event;

  await ddbDocClient.delete({
    TableName: process.env.tableName,
    Key: { jobId },
  });
};
