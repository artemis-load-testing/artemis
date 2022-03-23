import { Aws, Stack, StackProps } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
// import { aws_s3 as s3 } from "aws-cdk-lib";
// import { aws_ec2 as ec2 } from "aws-cdk-lib";
// import { aws_ecs as ecs } from "aws-cdk-lib";
import * as path from "path";
import {
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
  ManagedPolicy,
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { Code, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  Chain,
  Pass,
  StateMachine,
  Succeed,
} from "aws-cdk-lib/aws-stepfunctions";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Repository } from "aws-cdk-lib/aws-ecr";

export class AwsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const s3 = cdk.aws_s3;
    const ec2 = cdk.aws_ec2;
    const ecs = cdk.aws_ecs;
    const lambda = cdk.aws_lambda;
    const servicediscovery = cdk.aws_servicediscovery;

    // ROLES
    // const taskStatusCheckerRole = new Role(this, "TaskStatusRole", {
    //   assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    //   inlinePolicies: {
    //     TaskStatusPolicy: new PolicyDocument({
    //       statements: [
    //         new PolicyStatement({
    //           effect: Effect.ALLOW,
    //           actions: ["ecs:ListTasks"],
    //           resources: ["*"],
    //         }),
    //         new PolicyStatement({
    //           effect: Effect.ALLOW,
    //           actions: ["ecs:DescribeTasks"],
    //           resources: ["*"],
    //         }),
    //       ],
    //     }),
    //   },
    // });

    // const uploadTestScriptToS3Role = new Role(
    //   this,
    //   "uploadTestScriptToS3Role",
    //   {
    //     assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    //     inlinePolicies: {
    //       TaskStatusPolicy: new PolicyDocument({
    //         statements: [
    //           new PolicyStatement({
    //             effect: Effect.ALLOW,
    //             actions: ["s3:PutObject"],
    //             resources: ["*"], // re-evaluate
    //           }),
    //           new PolicyStatement({
    //             effect: Effect.ALLOW,
    //             actions: ["s3:CreateBucket"],
    //             resources: ["*"], // re-evaluate
    //           }),
    //           new PolicyStatement({
    //             effect: Effect.ALLOW,
    //             actions: ["sts:AssumeRole"],
    //             resources: ["*"], // re-evaluate
    //           }),
    //         ],
    //       }),
    //     },
    //   }
    // );

    const runTaskRole = new Role(this, "runTaskRole", {
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

    runTaskRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonECS_FullAccess")
    );

    const artemisS3Role = new Role(this, "artemis-s3", {
      assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    artemisS3Role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")
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
      subnetConfiguration: [
        {
          cidrMask: 24,
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
    const bucket = new s3.Bucket(this, "artemis-7-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Fargate
    const fargateTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      "taskdef",
      {
        memoryLimitMiB: 512, // 8192
        cpu: 256, // 4096
        taskRole: Role.fromRoleName(this, "fargateTaskRole", "artemis-s3"),
        // executionRole: Role.fromRoleName(
        //   this,
        //   'executionRole',
        //   'ecsTaskExecutionRole'
        // ),
      }
    );

    fargateTaskDefinition.addContainer("artemis-container", {
      image: ecs.ContainerImage.fromEcrRepository(
        // CHANGE TO PUBLIC
        Repository.fromRepositoryName(
          this,
          "artemis-testing",
          "artemis-testing"
        )
      ),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: "artemis-container-on-fargate",
      }),

      // image: ecs.ContainerImage.fromEcrRepository(
      //   Repository.fromRepositoryName(
      //     this,
      //     "artemis-testing",
      //     "artemis-testing"
      //   )
      // ),
      // environment: {
      //   name: bucket.bucketName,
      //   value: bucket.bucketName,
      // },
    });

    // public.ecr.aws/g7x4r6a9/artemis/artemis-telegraf:latest

    const telegrafTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      "telegrafTaskDef",
      {
        memoryLimitMiB: 8192,
        cpu: 4096,
        taskRole: telegrafToTimestreamRole
        // executionRole: Role.fromRoleName(
        //   this,
        //   'executionRole',
        //   'ecsTaskExecutionRole'
        // ),
      }
    );

    telegrafTaskDefinition.addContainer("telegraf-container", {
      image: ecs.ContainerImage.fromRegistry(
        "public.ecr.aws/g7x4r6a9/artemis/artemis-telegraf:latest"
      ),
      // image: ecs.ContainerImage.fromEcrRepository(
      //   // CHANGE TO PUBLIC
      //   Repository.fromRepositoryName(
      //     this,
      //     "artemis-telegraf-testing",
      //     "artemis-telegraf-testing"
      //   )
      // ),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: "artemis-telegraf-container-on-fargate",
      }),
    });

    // SECURITY GROUPS
    const telegrafSG = new ec2.SecurityGroup(this, "telegrafSG", {
      vpc,
      allowAllOutbound: true,
      description: "security group for telegraf",
    });

    telegrafSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "allow HTTP access from anywhere"
    );

    telegrafSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8186),
      "allow 8186 access from anywhere"
    );

    // SERVICES
    const telegrafService = new ecs.FargateService(this, "artemis-telegraf", {
      cluster,
      taskDefinition: telegrafTaskDefinition,
      desiredCount: 1,
      serviceName: "artemis-telegraf",
      cloudMapOptions: {
        cloudMapNamespace: cluster.addDefaultCloudMapNamespace({
          name: "artemis",
        }),
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: cdk.Duration.seconds(60),
      },
      securityGroups: [telegrafSG],
    });

    // LAMBDAS
    const runTaskLambda = new lambda.Function(this, "run-task", {
      handler: "index.handler",
      role: runTaskRole,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../resources/run-task")
      ),
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        TASK_CLUSTER: cluster.clusterName,
        TASK_DEFINITION: fargateTaskDefinition.taskDefinitionArn,
        VPC_ID: vpc.vpcId,
        // TASK_IMAGE: fargateTaskDefinition.defaultContainer.containerName,
        TASK_IMAGE: "artemis-container",
        BUCKET_NAME: bucket.bucketName,
      },
    });

    // const taskStatusChecker = new lambda.Function(this, "task-status-checker", {
    //   handler: "index.handler",
    //   role: taskStatusCheckerRole,
    //   code: lambda.Code.fromAsset(
    //     path.join(__dirname, "../resources/task-status-checker")
    //   ),
    //   runtime: lambda.Runtime.NODEJS_14_X,
    //   environment: {
    //     TASK_CLUSTER: cluster.clusterName,
    //   },
    // });
  }
}
