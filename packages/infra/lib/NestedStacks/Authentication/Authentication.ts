import * as cdk from "aws-cdk-lib";

import * as identity from "aws-cdk-lib/aws-cognito-identitypool";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as s3 from "aws-cdk-lib/aws-s3";

import { Construct } from "constructs";
import { NagSuppressions } from "cdk-nag";

interface IAuthentication {
  uiStorageBucket: s3.Bucket;
}

export class Authentication extends Construct {
  readonly userPoolClient: cognito.UserPoolClient;
  readonly identityPool: identity.IdentityPool;
  readonly userPool: cognito.UserPool;

  constructor(scope: Construct, id: string, props: IAuthentication) {
    super(scope, id);

    const stack = cdk.Stack.of(this);

    const { uiStorageBucket } = props;

    /**********************************************************************/
    /**************************** User Pool *******************************/
    /**********************************************************************/

    this.userPool = new cognito.UserPool(this, "UserPool", {
      standardThreatProtectionMode:
        cognito.StandardThreatProtectionMode.FULL_FUNCTION,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      featurePlan: cognito.FeaturePlan.PLUS,
      signInAliases: { email: true },
      userPoolName: stack.stackName,
      selfSignUpEnabled: false,
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireSymbols: true,
        requireUppercase: true,
      },
    });

    /**********************************************************************/
    /*************************** User Client ******************************/
    /**********************************************************************/

    this.userPoolClient = new cognito.UserPoolClient(this, "UserPool Client", {
      userPool: this.userPool,
      disableOAuth: true,
    });

    /************************************************************************/
    /*************************** Identity Pool ******************************/
    /************************************************************************/

    this.identityPool = new identity.IdentityPool(this, "Identity Pool", {
      identityPoolName: stack.stackName,
      authenticationProviders: {
        userPools: [
          new identity.UserPoolAuthenticationProvider({
            userPool: this.userPool,
            userPoolClient: this.userPoolClient,
          }),
        ],
      },
    });
    uiStorageBucket.grantReadWrite(this.identityPool.authenticatedRole);

    NagSuppressions.addResourceSuppressions(
      this.identityPool.authenticatedRole,
      [
        {
          id: "AwsSolutions-IAM5",
          reason:
            "Granting wildcard access for this role to interact in read and writing to this bucket",
        },
      ],
      true
    );
  }
}
