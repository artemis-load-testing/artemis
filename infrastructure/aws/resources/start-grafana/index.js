const AWS = require("aws-sdk");
const ec2 = new AWS.EC2();
const ecs = new AWS.ECS();
const s3 = new AWS.S3();

const wait = async () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 8000);
  });
};

exports.handler = async (event) => {
  const cluster = process.env.TASK_CLUSTER;
  const taskDefinition = process.env.TASK_DEFINITION;
  const subnets = [process.env.SUBNETS];
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

    const bucket = process.env.BUCKET_NAME;
    const fileName = "grafanapublicIP.txt";

    const bucketParams = {
      Bucket: bucket,
      Key: fileName,
      Body: ipAddress,
    };

    await s3.upload(bucketParams).promise();

    console.log(`Upload of ${fileName} complete`);
  } catch (error) {
    console.log(error);
  }
};
