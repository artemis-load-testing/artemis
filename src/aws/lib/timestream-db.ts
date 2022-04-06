import { aws_timestream as timestream, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";

export class ArtemisTimestreamDB extends Construct {
  database: timestream.CfnDatabase;
  constructor(scope: Construct, id: string, props?: any) {
    super(scope, id);
    this.database = new timestream.CfnDatabase(this, "artemis-db", {
      databaseName: props.databaseName,
    });

    this.database.applyRemovalPolicy(RemovalPolicy.RETAIN);
  }
}
