import { util } from "@aws-appsync/utils";

export const request = (ctx) => {
  const { codebuildArn } = ctx.args;

  return {
    method: "POST",
    resourcePath: "/",
    params: {
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": "CodeBuild_20161006.BatchGetBuilds",
      },
      body: {
        ids: [codebuildArn],
      },
    },
  };
};

export const response = (ctx) => {
  const { result } = ctx;
  if (result.statusCode !== 200) {
    return util.error(result.body, `${result.statusCode}`);
  }
  return JSON.parse(result.body).builds[0];
};
