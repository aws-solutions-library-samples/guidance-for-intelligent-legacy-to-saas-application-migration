import { get } from "@aws-appsync/utils/dynamodb";

export const request = (ctx) => {
  const { jobId } = ctx.args;

  return get({ key: { jobId } });
};

export const response = (ctx) => {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }

  return ctx.result;
};
