import {
  CloudWatchClient,
  GetMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";

import {
  BedrockAgentClient,
  ListKnowledgeBasesCommand,
} from "@aws-sdk/client-bedrock-agent";

import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { startOfWeek, endOfWeek, subWeeks } from "date-fns";

const ddbClient = new DynamoDBClient({});
const cwClient = new CloudWatchClient({});
const baClient = new BedrockAgentClient({});

export const handler = async () => {
  const cwTableHistory = await cwClient.send(
    new GetMetricDataCommand({
      StartTime: startOfWeek(subWeeks(new Date(), 1)),
      EndTime: endOfWeek(subWeeks(new Date(), 1)),
      MetricDataQueries: [
        {
          Id: "itemCountLastWeek",
          MetricStat: {
            Metric: {
              Namespace: "AWS/DynamoDB",
              MetricName: "ItemCount",
              Dimensions: [
                {
                  Name: "TableName",
                  Value: process.env.tableName,
                },
              ],
            },
            Period: 604800,
            Stat: "Average",
          },
          ReturnData: true,
        },
        {
          Id: "tableSizeBytesLastWeek",
          MetricStat: {
            Metric: {
              Namespace: "AWS/DynamoDB",
              MetricName: "TableSizeBytes",
              Dimensions: [
                {
                  Name: "TableName",
                  Value: process.env.tableName,
                },
              ],
            },
            Period: 604800,
            Stat: "Average",
          },
          ReturnData: true,
        },
      ],
    })
  );

  const tableMetadata = await ddbClient.send(
    new DescribeTableCommand({
      TableName: process.env.tableName,
    })
  );

  const cwSfnHistory = await cwClient.send(
    new GetMetricDataCommand({
      StartTime: subWeeks(new Date(), 1),
      EndTime: new Date(),
      MetricDataQueries: [
        {
          Id: "stepFunctionExecutionsLastWeek",
          MetricStat: {
            Metric: {
              Namespace: "AWS/States",
              MetricName: "ExecutionsStarted",
              Dimensions: [
                {
                  Name: "StateMachineArn",
                  Value: process.env.stepFunctionArn,
                },
              ],
            },
            Period: 604800,
            Stat: "Sum",
          },
          ReturnData: true,
        },
      ],
    })
  );

  let totalKbs = 0;
  let nextToken = null;

  do {
    const kbList = await baClient.send(
      new ListKnowledgeBasesCommand({ nextToken })
    );
    totalKbs += kbList.knowledgeBaseSummaries.length;

    nextToken = kbList.nextToken;
  } while (nextToken);

  return {
    jobs: {
      ItemCount: tableMetadata.Table.ItemCount,
      ItemCountLastWeek: cwTableHistory.MetricDataResults[0].Values?.[0] ?? 0,
      TableSizeBytes: tableMetadata.Table.TableSizeBytes,
      TableSizeBytesLastWeek:
        cwTableHistory.MetricDataResults[1].Values?.[0] ?? 0,
    },
    sfnAssessments: {
      ExecutionsStartedLastWeek:
        cwSfnHistory.MetricDataResults[0].Values?.[0] ?? 0,
    },
    totalKbs,
  };
};
