import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs"; // ES Modules import
import { EC2Client, DescribeSubnetsCommand } from "@aws-sdk/client-ec2"; // ES Modules import
// const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs"); // CommonJS import

const retrieveSubnets = async (vpcId) => {
  const ec2Client = new EC2Client();
  const params = {
    Filters: [
      {
        Name: "vpc-id",
        Values: [vpcId],
      },
    ],
  };

  const command = new DescribeSubnetsCommand(params);
  const response = await ec2Client.send(command);
  const subnets = response.Subnets.map((subnet) => subnet.SubnetId);
  return [subnets[0]];
};

export default async function runTask(count) {
  try {
    const ecsClient = new ECSClient();

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

    const runTaskCommand = new RunTaskCommand(params);
    await ecsClient.send(runTaskCommand);
  } catch (error) {
    console.log(error);
  }
}
