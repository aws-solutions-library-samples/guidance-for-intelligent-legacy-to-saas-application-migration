import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";

const ddbClient = new DynamoDBClient({});
const cwClient = new CloudWatchClient({});

export const handler = async () => {
  const tableMetadata = await ddbClient.send(
    new DescribeTableCommand({
      TableName: process.env.tableName,
    })
  );

  const MetricData = [
    {
      MetricName: "ItemCount",
      Dimensions: [
        {
          Name: "TableName",
          Value: process.env.tableName,
        },
      ],
      Unit: "Count",
      Value: tableMetadata.Table.ItemCount,
    },
    {
      MetricName: "TableSizeBytes",
      Dimensions: [
        {
          Name: "TableName",
          Value: process.env.tableName,
        },
      ],
      Unit: "Bytes",
      Value: tableMetadata.Table.TableSizeBytes,
    },
  ];

  await cwClient.send(
    new PutMetricDataCommand({
      Namespace: "AWS/DynamoDB",
      MetricData,
    })
  );

  return MetricData;
};
