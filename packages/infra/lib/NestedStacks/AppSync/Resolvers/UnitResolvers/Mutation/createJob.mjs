import * as ddb from "@aws-appsync/utils/dynamodb";
import { util } from "@aws-appsync/utils";

export const request = (ctx) => {
  const timestamp = util.time.nowISO8601();
  const jobId = "job-" + util.autoId().substring(4);

  const key = { jobId };

  const item = {
    ...ctx.args.input,
    createdAt: timestamp,
    updatedAt: timestamp,
    model: {
      label: "US Claude Sonnet 4",
      value: "us.anthropic.claude-sonnet-4-20250514-v1:0",
    },
  };

  return ddb.put({ key, item });
};

export const response = (ctx) => {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }

  return ctx.result;
};
