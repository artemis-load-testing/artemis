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
  console.log("vpcid ", process.env.VPC_ID);
  console.log("cluster ", process.env.TASK_CLUSTER);
  console.log("definition ", process.env.TASK_DEFINITION);
  console.log("image ", process.env.TASK_IMAGE);
  console.log(event.originTimestamp);

  const VPC_ID = process.env.VPC_ID;
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
    overrides: {
      containerOverrides: [{
        name: process.env.TASK_IMAGE,
        environment: [
          { name: 'ORIGIN_TIMESTAMP', value: String(event.originTimestamp) }
        ]
      }]
    }
  };

  try {
    await ecs.runTask(taskParams).promise();
    console.log("Task started");
  } catch (error) {
    console.log(error);
  }
};
