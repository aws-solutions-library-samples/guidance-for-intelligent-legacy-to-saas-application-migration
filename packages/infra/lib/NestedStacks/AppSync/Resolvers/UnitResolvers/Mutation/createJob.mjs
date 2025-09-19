import { util } from "@aws-appsync/utils";

export const request = (ctx) => {
  return {
    operation: "Invoke",
    payload: ctx.args.input,
  };
};

export const response = (ctx) => {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }

  return ctx.result;
};
