import { aws_lambda as lambda, Duration } from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";

export class StopGrafanaLambda extends Construct {
  handler: lambda.Function;
  constructor(scope: Construct, id: string, props?: any) {
    super(scope, id);

    this.handler = new lambda.Function(this, "stop-grafana", {
      handler: "index.handler",
      role: props.role,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../resources/stop-grafana")
      ),
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        TASK_CLUSTER: props.TASK_CLUSTER,
        TASK_DEFINITION: props.TASK_DEFINITION,
      },
      timeout: Duration.seconds(60),
    });
  }
}
