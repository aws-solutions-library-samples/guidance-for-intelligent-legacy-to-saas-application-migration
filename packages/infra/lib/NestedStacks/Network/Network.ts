import * as ec2 from "aws-cdk-lib/aws-ec2";

import { Construct } from "constructs";

export class Network extends Construct {
  readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, "Vpc", {
      flowLogs: {
        logs: {},
      },
    });
  }
}
