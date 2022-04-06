import { aws_lambda as lambda, Duration } from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";

export class RunTaskLambda extends Construct {
  handler: lambda.Function;
  constructor(scope: Construct, id: string, props?: any) {
    super(scope, id);

    this.handler = new lambda.Function(this, id, {
      handler: "index.handler",
      role: props.role,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../resources/run-task")
      ),
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        TASK_CLUSTER: props.TASK_CLUSTER,
        TASK_DEFINITION: props.TASK_DEFINITION,
        VPC_ID: props.VPC_ID,
        TASK_IMAGE: props.TASK_IMAGE,
        BUCKET_NAME: props.BUCKET_NAME,
        TELEGRAF_SERVICE: props.TELEGRAF_SERVICE,
      },
      timeout: Duration.seconds(180),
    });
  }
}
