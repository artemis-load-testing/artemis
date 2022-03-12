import { Stack, StackProps } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class AwsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const s3 = cdk.aws_s3;
    const ec2 = cdk.aws_ec2;
    const ecs = cdk.aws_ecs;

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
    });

    // S3 bucket
    const bucket = new s3.Bucket(this, "team-7-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      bucketName: "team-7-bucket",
    });

    // Fargate
    const fargateTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      "taskdef",
      {
        memoryLimitMiB: 1024,
        cpu: 512,
      }
    );

    fargateTaskDefinition.addContainer("k6Container", {
      image: ecs.ContainerImage.fromRegistry("grafana/k6"),
      environment: {
        name: bucket.bucketName,
        value: bucket.bucketName,
      },
    });

    // lambda?
  }
}