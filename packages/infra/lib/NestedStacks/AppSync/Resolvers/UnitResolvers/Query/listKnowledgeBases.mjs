import { util } from "@aws-appsync/utils";

export const request = (ctx) => {
  return {
    method: "POST",
    resourcePath: "/knowledgebases",
    params: {
      //   query: {
      //     maxResults: "10", // Optional: adjust as needed
      //     nextToken: ctx.args.nextToken // Uncomment if implementing pagination
      //   },
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
    },
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
