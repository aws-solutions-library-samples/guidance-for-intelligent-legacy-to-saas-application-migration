import { util } from "@aws-appsync/utils";

export const request = (ctx) => {
  return {
    version: "2018-05-29",
    payload: ctx.args.input,
  };
};

export const response = (ctx) => {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }

  return ctx.args.input;
};
