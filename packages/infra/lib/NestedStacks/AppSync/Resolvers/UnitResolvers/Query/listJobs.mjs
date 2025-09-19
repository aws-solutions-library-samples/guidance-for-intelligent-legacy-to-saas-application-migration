import * as ddb from "@aws-appsync/utils/dynamodb";

export const request = (ctx) => {
  const { limit = 20, nextToken } = ctx.args;

  return ddb.scan({ limit, nextToken });
};

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }

  // Format response to match the JobConnection type
  return {
    jobs: ctx.result.items || [],
    nextToken: ctx.result.nextToken,
  };
}
