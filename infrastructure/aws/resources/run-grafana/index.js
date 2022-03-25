const AWS = require("aws-sdk");
const ec2 = new AWS.EC2();
const ecs = new AWS.ECS();

const retrieveSubnets = async (vpcId) => {
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

const wait = async () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 8000);
  });
};

exports.handler = async (event) => {
  const VPC_ID = process.env.VPC_ID;
  const cluster = process.env.TASK_CLUSTER;
  const taskDefinition = process.env.TASK_DEFINITION;
  const subnets = await retrieveSubnets(VPC_ID);
  const securityGroup = process.env.SECURITY_GROUP;

  const taskParams = {
    cluster,
    taskDefinition,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets,
        assignPublicIp: "ENABLED",
        securityGroups: [securityGroup],
      },
    },
  };

  try {
    const tasks = await ecs.runTask(taskParams).promise();
    await wait();
    const describeTasks = await ecs
      .describeTasks({ cluster, tasks: [tasks.tasks[0].taskArn] })
      .promise();
    const eni = describeTasks.tasks[0].attachments[0].details[1].value;
    const networkInterfaces = await ec2
      .describeNetworkInterfaces({ NetworkInterfaceIds: [eni] })
      .promise();
    const ipAddress =
      networkInterfaces.NetworkInterfaces[0].Association.PublicIp;
    console.log("This is the public IP:", ipAddress);
    return ipAddress;
  } catch (error) {
    console.log(error);
  }
};
