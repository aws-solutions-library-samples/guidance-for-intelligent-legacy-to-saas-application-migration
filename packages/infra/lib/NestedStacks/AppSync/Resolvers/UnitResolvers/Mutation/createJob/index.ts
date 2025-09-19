import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import {
  S3Client,
  ListObjectsCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";

const ddbClient = new DynamoDB({});
const ddbDocClient = DynamoDBDocument.from(ddbClient);
const s3Client = new S3Client({});

export const handler = async (event) => {
  const timestamp = new Date().toISOString();
  const jobId = uuidv4();

  const list = await s3Client.send(
    new ListObjectsCommand({
      Bucket: process.env.bucket,
      Prefix: "workflow-template/",
    })
  );

  for (const content of list.Contents) {
    await s3Client.send(
      new CopyObjectCommand({
        Bucket: process.env.bucket,
        CopySource: `/${process.env.bucket}/${content.Key}`,
        Key: `jobs/${jobId}/code/${content.Key.split("/").slice(1).join("/")}`,
      })
    );
  }

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
