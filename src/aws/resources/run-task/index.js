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
    const taskBatchLoops = Math.ceil(count / AWSTaskCountLimit);
    const NTasksLeftToRun = count % AWSTaskCountLimit;

    taskParams.count = AWSTaskCountLimit;
    let instanceTaskPromises = [];
    for (let i = 1; i <= taskBatchLoops - 1; i++) {
      instanceTaskPromises.push(ecs.runTask(taskParams).promise());
    }

    taskParams.count = NTasksLeftToRun;

    instanceTaskPromises.push(ecs.runTask(taskParams).promise());

    await Promise.allSettled(instanceTaskPromises);

    console.log('Tasks started');
  } catch (error) {
    console.log(error);
  }
};
