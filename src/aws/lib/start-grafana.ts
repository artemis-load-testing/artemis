import { aws_ec2 as ec2, aws_lambda as lambda, Duration } from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";

export class StartGrafanaLambda extends Construct {
  handler: lambda.Function;
  constructor(scope: Construct, id: string, props?: any) {
    super(scope, id);
    const grafanaSG = new ec2.SecurityGroup(this, "grafanaSG", {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: "security group for grafana",
    });

    grafanaSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "allow HTTP access from anywhere"
    );

    grafanaSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3000),
      "allow 3000 access from anywhere"
    );

    this.handler = new lambda.Function(this, id, {
      handler: "index.handler",
      role: props.role,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../resources/start-grafana")
      ),
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        TASK_CLUSTER: props.TASK_CLUSTER,
        TASK_DEFINITION: props.TASK_DEFINITION,
        VPC_ID: props.VPC_ID,
        GRAFANA_IMAGE: props.GRAFANA_IMAGE,
        SECURITY_GROUP: grafanaSG.securityGroupId,
        SUBNETS: props.SUBNETS,
        BUCKET_NAME: props.BUCKET_NAME,
      },
      timeout: Duration.seconds(300),
    });
  }
}
