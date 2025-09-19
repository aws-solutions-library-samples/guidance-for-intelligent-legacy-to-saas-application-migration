import { util } from "@aws-appsync/utils";

export const request = (ctx) => {
  const { jobId } = ctx.args;

  return {
    method: "POST",
    resourcePath: "/",
    params: {
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": "CodeBuild_20161006.StartBuild",
      },
      body: {
        projectName: ctx.env.CODEBUILD_PROJECT_NAME,
        environmentVariablesOverride: [
          {
            name: "JOB_ID",
            value: jobId,
          },
          {
            name: "IMAGE_TAG",
            value: util.autoId(),
          },
        ],
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
