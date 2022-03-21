const AWS = require("aws-sdk");
const ec2 = new AWS.EC2();
const ecs = new AWS.ECS();

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
  const subnetIds = subnets.Subnets.map((subnet) => subnet.SubnetId);
  return [subnetIds[0]];
};
exports.handler = async (event) => {
  const VPC_ID = "vpc-0315de4e949a30efb";
  const subnets = await retrieveSubnets(VPC_ID);
  const count = event.taskCount;

  const taskParams = {
    cluster: process.env.TASK_CLUSTER,
    taskDefinition: process.env.TASK_DEFINITION,
    launchType: "FARGATE",
    count,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets,
        assignPublicIp: "ENABLED",
      },
    },
  };

  try {
    await ecs.runTask(taskParams).promise();
    console.log("Task started");
  } catch (error) {
    console.log(error);
  }
};
