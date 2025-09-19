import { util } from "@aws-appsync/utils";

export const request = (ctx) => {
  return {
    method: "GET",
    resourcePath: "/inference-profiles",
  };
};

export const response = (ctx) => {
  if (ctx.error) {
    util.error(
      `Error calling Bedrock API: ${ctx.error.message}`,
      ctx.error.type,
      ctx.result
    );
  }
  if (ctx.result.statusCode === 200) {
    return JSON.parse(ctx.result.body);
  } else {
    util.error(ctx.result.body, ctx.result.statusCode);
  }
};
