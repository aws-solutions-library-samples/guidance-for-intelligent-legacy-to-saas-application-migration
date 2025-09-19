import { util } from "@aws-appsync/utils";

export const request = (ctx) => {
  const { args } = ctx;

  return {
    version: "2018-05-29",
    method: "POST",
    resourcePath: "/",
    params: {
      headers: {
        "content-type": "application/x-amz-json-1.0",
        "x-amz-target": "AWSStepFunctions.StartExecution",
      },
      body: {
        stateMachineArn: ctx.env.STEP_FUNCTION_ARN,
        input: JSON.stringify(args),
      },
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
