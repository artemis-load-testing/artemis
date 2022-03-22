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
  console.log("bucket", process.env.BUCKET_NAME);
  console.log(event.originTimestamp);

  const VPC_ID = process.env.VPC_ID;
  const subnets = await retrieveSubnets(VPC_ID);
  let count = event.taskCount;
  const AWSTaskCountLimit = 10;
  /*
  - define a constant to capture the number of tasks that AWS can start (i.e., 10)
  - divide the taskCount by the constant, round up to the nearest integer
  - 11 / 10 => 2 (N)  Run 10 tasks, N-1 times
  - 11 % 10 => 1 (x)  Run x tasks, 1 time
  */

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
      containerOverrides: [
        {
          name: process.env.TASK_IMAGE,
          environment: [
            { name: "ORIGIN_TIMESTAMP", value: String(event.originTimestamp) },
            { name: "BUCKET_NAME", value: process.env.BUCKET_NAME },
          ],
        },
      ],
    },
  };

  try {
    const taskBatchLoops = Math.ceil(count / AWSTaskCountLimit);
    const NTasksLeftToRun = count % AWSTaskCountLimit;

    taskParams.count = AWSTaskCountLimit;
    console.log("taskParams.count:", taskParams.count);

    for (let i = 1; i <= taskBatchLoops - 1; i++) {
      console.log("inside for loop:", i);
      await ecs.runTask(taskParams).promise();
    }

    taskParams.count = NTasksLeftToRun;
    console.log("taskParams.count:", taskParams.count);
    await ecs.runTask(taskParams).promise();

    console.log("Task started");
  } catch (error) {
    console.log(error);
  }
};
