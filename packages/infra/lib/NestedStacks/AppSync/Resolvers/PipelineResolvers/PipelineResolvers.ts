import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cb from "aws-cdk-lib/aws-codebuild";

import { Construct } from "constructs";

interface IPipelineResolvers {
  graphqlApi: appsync.GraphqlApi;
  sfnHttpDs: appsync.HttpDataSource;
  ddbDs: appsync.DynamoDbDataSource;
  codeBuildProject: cb.Project;
  codeBuildHttpDs: appsync.HttpDataSource;
}

export class PipelineResolvers extends Construct {
  readonly graphqlApi: appsync.GraphqlApi;
  readonly ddbDs: appsync.DynamoDbDataSource;

  constructor(scope: Construct, id: string, props: IPipelineResolvers) {
    super(scope, id);

    const { graphqlApi, sfnHttpDs, ddbDs, codeBuildHttpDs } = props;

    this.graphqlApi = graphqlApi;
    this.ddbDs = ddbDs;

    /*************************************************************/
    /*********************** Data Sources ************************/
    /*************************************************************/

    /*************************************************************/
    /************************* Mutations *************************/
    /*************************************************************/

    this.startAssessment("Mutation", "startAssessment", sfnHttpDs);
    this.startDeployment("Mutation", "startDeployment", codeBuildHttpDs);
  }

  startAssessment = (
    typeName: "Mutation" | "Query",
    fieldName: string,
    dataSource: appsync.HttpDataSource
  ) => {
    const s1 = new appsync.AppsyncFunction(this, "Start Sfn", {
      name: "startStepFunction",
      api: this.graphqlApi,
      dataSource,
      code: appsync.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/startStepFunction.mjs`
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    const s2 = new appsync.AppsyncFunction(this, "Update Job SF", {
      name: "updateJob",
      api: this.graphqlApi,
      dataSource: this.ddbDs,
      code: appsync.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/updateJob.mjs`
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + "/DefaultPipelineTemplate.mjs"),
      pipelineConfig: [s1, s2],
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      fieldName,
      typeName,
    });
  };

  startDeployment = (
    typeName: "Mutation" | "Query",
    fieldName: string,
    dataSource: appsync.HttpDataSource
  ) => {
    const s1 = new appsync.AppsyncFunction(this, "Start CodeBuild", {
      name: "startCodeBuild",
      api: this.graphqlApi,
      dataSource,
      code: appsync.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/startCodeBuild.mjs`
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    const s2 = new appsync.AppsyncFunction(this, "Update Job CB", {
      name: "updateJob",
      api: this.graphqlApi,
      dataSource: this.ddbDs,
      code: appsync.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/updateJob.mjs`
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + "/DefaultPipelineTemplate.mjs"),
      pipelineConfig: [s1, s2],
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      fieldName,
      typeName,
    });
  };
}
