import { util } from "@aws-appsync/utils";

export const request = (ctx) => {
  const { executionArn } = ctx.args;

  return {
    version: "2018-05-29",
    method: "POST",
    resourcePath: "/",
    params: {
      headers: {
        "content-type": "application/x-amz-json-1.0",
        "x-amz-target": "AWSStepFunctions.DescribeExecution",
      },
      body: { executionArn },
    },
  };
};

export const response = (ctx) => {
  const { result } = ctx;
  if (result.statusCode !== 200) {
    return util.error(result.body, `${result.statusCode}`);
  }
  const body = JSON.parse(result.body);

  return body;
};
