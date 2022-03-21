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
    const cluster = new ecs.Cluster(this, "vpc-cluster", {
      vpc,
      containerInsights: true,
      clusterName: "vpc-cluster",
    });

    // S3 bucket
    // const bucket = new s3.Bucket(this, "team-7-bucket", {
    //   removalPolicy: cdk.RemovalPolicy.DESTROY,
    //   autoDeleteObjects: true,
    //   bucketName: "team-7-bucket",
    // });

    // Fargate
    const fargateTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      "taskdef",
      {
        memoryLimitMiB: 1024,
        cpu: 512,
        taskRole: Role.fromRoleName(this, "taskRole", "ecsTaskExecutionRole"),
        executionRole: Role.fromRoleName(
          this,
          "executionRole",
          "ecsTaskExecutionRole"
        ),
      }
    );

    fargateTaskDefinition.addContainer("artemis-container", {
      image: ecs.ContainerImage.fromEcrRepository(
        Repository.fromRepositoryName(
          this,
          "artemis-test",
          "artemis-test"
        )
      ),
      // image: ecs.ContainerImage.fromRegistry("artemis-test:latest"),
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

    // LAMBDAS

    const runTaskLambda = new lambda.Function(this, "run-task", {
      handler: "index.handler",
      role: runTaskRole, // update
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
