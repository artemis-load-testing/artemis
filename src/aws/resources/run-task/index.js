const AWS = require('aws-sdk');
const ec2 = new AWS.EC2();
const ecs = new AWS.ECS();

const retrieveSubnets = async (vpcId) => {
  const params = {
    Filters: [
      {
        Name: 'vpc-id',
        Values: [vpcId],
      },
    ],
  };

  const subnets = await ec2.describeSubnets(params).promise();
  const subnetIds = subnets.Subnets.map((subnet) => subnet.SubnetId);
  return [subnetIds[0]];
};

exports.handler = async (event) => {
  const VPC_ID = process.env.VPC_ID;
  const subnets = await retrieveSubnets(VPC_ID);
  let count = event.taskCount;
  let testId = event.testId;
  const AWSTaskCountLimit = 10;

  const taskParams = {
    cluster: process.env.TASK_CLUSTER,
    taskDefinition: process.env.TASK_DEFINITION,
    launchType: 'FARGATE',
    count,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets,
        assignPublicIp: 'ENABLED',
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: process.env.TASK_IMAGE,
          environment: [
            { name: 'ORIGIN_TIMESTAMP', value: String(event.originTimestamp) },
            { name: 'BUCKET_NAME', value: process.env.BUCKET_NAME },
            { name: 'TASK_COUNT', value: count },
            { name: 'TEST_ID', value: testId },
          ],
        },
      ],
    },
  };

  try {
    await ecs
      .updateService({
        cluster: process.env.TASK_CLUSTER,
        service: process.env.TELEGRAF_SERVICE,
        desiredCount: 1,
      })
      .promise();

    // count = 10
    const taskBatchLoops = Math.ceil(count / AWSTaskCountLimit); // 1
    const NTasksLeftToRun = count % AWSTaskCountLimit; // 0

    taskParams.count = AWSTaskCountLimit; // 10
    let instanceTaskPromises = [];

    for (let i = 1; i <= taskBatchLoops - 1; i++) {
      instanceTaskPromises.push(ecs.runTask(taskParams).promise());
    }

    console.log('taskArrLength:', instanceTaskPromises.length);

    if (NTasksLeftToRun === 0) {
      taskParams.count = AWSTaskCountLimit;
    } else {
      taskParams.count = NTasksLeftToRun;
    }

    instanceTaskPromises.push(ecs.runTask(taskParams).promise());
    console.log('taskArrLength:', instanceTaskPromises.length);

    await Promise.allSettled(instanceTaskPromises);

    console.log('Tasks started');
  } catch (error) {
    console.log(error);
  }
};
