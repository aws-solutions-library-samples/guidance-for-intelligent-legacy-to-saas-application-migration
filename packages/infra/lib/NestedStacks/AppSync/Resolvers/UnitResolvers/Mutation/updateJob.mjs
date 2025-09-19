import * as ddb from "@aws-appsync/utils/dynamodb";
import { util } from "@aws-appsync/utils";

export const request = (ctx) => {
  const { input } = ctx.args;
  const { jobId, ...update } = input;

  update.updatedAt = util.time.nowISO8601();

  if (update.kb && typeof update.kb === "object") {
    update.kb = ddb.operations.replace(update.kb);
  }

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
