const AWS = require("aws-sdk");
const ec2 = new AWS.EC2();
const ecs = new AWS.ECS();
// const { EC2Client, DescribeSubnetsCommand } = require("@aws-sdk/client-ec2");
// const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");

// const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs"); // CommonJS import
const retrieveSubnets = async (vpcId) => {
  // const ec2Client = new EC2Client();
  const params = {
    Filters: [
      {
        Name: "vpc-id",
        Values: [vpcId],
      },
    ],
  };

  const subnets = await ec2.describeSubnets(params).promise();
  // const response = await ec2.send(command);
  const subnetIds = subnets.map((subnet) => subnet.SubnetId);
  return [subnetIds[0]];
};

exports.handler = async () => {
  try {
    // const ecsClient = new ECSClient();
    const count = 1;

    const VPC_ID = "vpc-0315de4e949a30efb";
    const subnets = await retrieveSubnets(VPC_ID);

    const params = {
      cluster: "vpc-cluster",
      taskDefinition:
        "arn:aws:ecs:us-east-1:212969361077:task-definition/AwsStacktaskdefDCFBA26C:6",
      count,
      launchType: "FARGATE",
      networkConfiguration: {
        awsvpcConfiguration: {
          assignPublicIp: "ENABLED",
          subnets,
        },
      },
    };

    const runTaskCommand = await ecs.runTask(params).promise();
    // await ecsClient.send(runTaskCommand);
  } catch (error) {
    console.log(error);
  }
};
