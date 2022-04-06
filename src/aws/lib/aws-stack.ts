import {
  aws_s3 as s3,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_timestream as timestream,
  Stack,
  StackProps,
  RemovalPolicy,
} from "aws-cdk-lib";
import {
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
  ManagedPolicy,
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { RunTaskLambda } from "./run-task-lambda";
import { StartGrafanaLambda } from "./start-grafana";
import { StopGrafanaLambda } from "./stop-grafana";
import { TelegrafService } from "./telegraf-service";
import { ArtemisTimestreamDB } from "./timestream-db";

export class AwsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // ROLES
    const runLambdaRole = new Role(this, "runLambdaRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      inlinePolicies: {
        TaskStatusPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ["logs:CreateLogGroup"],
              resources: ["*"], // re-evaluate
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ["logs:CreateLogStream"],
              resources: ["*"], // re-evaluate
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ["logs:PutLogEvents"],
              resources: ["*"], // re-evaluate
            }),
          ],
        }),
      },
    });

    runLambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonECS_FullAccess")
    );

    runLambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")
    );

    const artemisS3Role = new Role(this, "artemis-s3", {
      assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    artemisS3Role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")
    );

    const GrafanaReadsAWSTimestream = new Role(
      this,
      "AllowTimestreamArtemisDBToGrafana",
      {
        assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
      }
    );

    GrafanaReadsAWSTimestream.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonTimestreamReadOnlyAccess")
    );

    const telegrafToTimestreamRole = new Role(
      this,
      "AllowTelegrafToTimestreamArtemisDB",
      {
        assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
        inlinePolicies: {
          TaskStatusPolicy: new PolicyDocument({
            statements: [
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ["timestream:DescribeDatabase"],
                resources: ["*"], // re-evaluate
              }),
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ["timestream:WriteRecords"],
                resources: ["*"], // re-evaluate
              }),
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ["timestream:CreateTable"],
                resources: ["*"], // re-evaluate
              }),
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ["timestream:DescribeEndpoints"],
                resources: ["*"], // re-evaluate
              }),
            ],
          }),
        },
      }
    );

    // CONSTRUCTS
    // VPC
    const vpc = new ec2.Vpc(this, "vpc", {
      maxAzs: 2,
      cidr: "10.0.0.0/24",
      subnetConfiguration: [
        {
          name: "ingress",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // ECS
    const cluster = new ecs.Cluster(this, "artemis-vpc-cluster", {
      vpc,
      containerInsights: true,
    });

    // S3 bucket
    const bucket = new s3.Bucket(this, "artemis-bucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // TASK DEFINITIONS
    // Artemis-testing
    const fargateTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      "taskdef",
      {
        memoryLimitMiB: 2048,
        cpu: 1024,
        taskRole: artemisS3Role,
      }
    );

    fargateTaskDefinition.addContainer("artemis-container", {
      image: ecs.ContainerImage.fromRegistry(
        "public.ecr.aws/g7x4r6a9/artemis/artemis-testing:latest"
      ),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: "artemis-container-on-fargate",
      }),
    });

    // Grafana
    const grafanaTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      "grafanaTaskDef",
      {
        memoryLimitMiB: 1024,
        cpu: 512,
        taskRole: GrafanaReadsAWSTimestream,
      }
    );

    grafanaTaskDefinition.addContainer("grafana-container", {
      image: ecs.ContainerImage.fromRegistry(
        "public.ecr.aws/g7x4r6a9/artemis/artemis-grafana:latest"
      ),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: "artemis-grafana-container-on-fargate",
      }),
    });

    // Telegraf
    const telegrafTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      "telegrafTaskDef",
      {
        memoryLimitMiB: 8192,
        cpu: 4096,
        taskRole: telegrafToTimestreamRole,
      }
    );

    telegrafTaskDefinition.addContainer("telegraf-container", {
      image: ecs.ContainerImage.fromRegistry(
        "public.ecr.aws/g7x4r6a9/artemis/artemis-telegraf:latest"
      ),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: "artemis-telegraf-container-on-fargate",
      }),
    });

    // Check if first deploy
    const fs = require("fs");
    let firstDeployStatus = JSON.parse(
      fs.readFileSync("config.json", "utf8")
    ).firstDeploy;

    if (firstDeployStatus === "true") {
      // TimestreamDB
      const artemisTimestreamDB = new ArtemisTimestreamDB(this, "artemis-db", {
        databaseName: "artemis-db",
      });
    }

    // SERVICES
    const telegrafService = new TelegrafService(this, "artemis-telegraf", {
      vpc: vpc,
      cluster: cluster,
      taskDefinition: telegrafTaskDefinition,
    });

    // LAMBDAS
    const runTaskLambda = new RunTaskLambda(this, "run-task", {
      role: runLambdaRole,
      TASK_CLUSTER: cluster.clusterName,
      TASK_DEFINITION: fargateTaskDefinition.taskDefinitionArn,
      VPC_ID: vpc.vpcId,
      TASK_IMAGE: "artemis-container",
      BUCKET_NAME: bucket.bucketName,
      TELEGRAF_SERVICE: "artemis-telegraf",
    });

    const startGrafanaLambda = new StartGrafanaLambda(this, "start-grafana", {
      role: runLambdaRole,
      vpc: vpc,
      TASK_CLUSTER: cluster.clusterName,
      TASK_DEFINITION: grafanaTaskDefinition.taskDefinitionArn,
      VPC_ID: vpc.vpcId,
      GRAFANA_IMAGE: "artemis-grafana",
      SUBNETS: vpc.publicSubnets[0].subnetId,
      BUCKET_NAME: bucket.bucketName,
    });

    const stopGrafanaTaskLambda = new StopGrafanaLambda(this, "stop-grafana", {
      role: runLambdaRole,
      TASK_CLUSTER: cluster.clusterName,
      TASK_DEFINITION: grafanaTaskDefinition.taskDefinitionArn,
    });
  }
}
