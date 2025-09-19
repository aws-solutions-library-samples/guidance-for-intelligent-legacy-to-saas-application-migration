import * as ddb from "@aws-appsync/utils/dynamodb";
import { util } from "@aws-appsync/utils";

export const request = (ctx) => {
  const { jobId } = ctx.args;

  const update = {
    executionArn: ctx.prev.result.executionArn,
    updatedAt: util.time.nowISO8601(),
  };

  return ddb.update({
    key: { jobId },
    update,
  });
};

export const response = (ctx) => {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }

  return ctx.result;
};
