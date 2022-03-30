const AWS = require("aws-sdk");
const execSync = require("child_process").execSync;
const userRegion = execSync("aws configure get region").toString().trim();
AWS.config.update({ region: userRegion });
const s3 = new AWS.S3();
const ecs = new AWS.ECS();
const lambda = new AWS.Lambda();
const fs = require("fs");
const util = require("util");
const stackName = "ArtemisAwsStack";
const clusterName = "artemisvpccluster";
const telegrafServiceName = "artemis-telegraf";

const getArtemisBucket = async (desiredBucketName) => {
  const buckets = await s3.listBuckets({}).promise();
  const artemisBucket = buckets.Buckets.find((bucket) => {
    const bucketName = bucket.Name.toLowerCase();
    return bucketName.includes(
      `${stackName}-${desiredBucketName}`.toLowerCase()
    );
  });
  return artemisBucket;
};

const getArtemisCluster = async (desiredClusterName) => {
  const clusters = await ecs.listClusters({}).promise();
  const artemisCluster = clusters.clusterArns.find((clusterArn) => {
    return clusterArn.includes(desiredClusterName);
  });
  return artemisCluster;
};

const getTelegrafService = async (cluster, desiredServiceName) => {
  const services = await ecs.listServices({ cluster }).promise();
  const telegrafService = services.serviceArns.find((serviceArn) => {
    return serviceArn.includes(desiredServiceName);
  });
  return telegrafService;
};

const uploadToBucket = async (bucketParams) => {
  try {
    const artemisBucket = await getArtemisBucket(bucketParams.Bucket);
    bucketParams.Bucket = artemisBucket.Name;
    await s3.upload(bucketParams).promise();
  } catch (err) {
    console.log(err);
  }
};

const run = async (testContent, key) => {
  const params = {
    Bucket: "artemisbucket",
    Key: key,
    Body: testContent,
  };

  await uploadToBucket(params);
};

const uploadTestScript = async (fileName) => {
  try {
    let testContent = fs.readFileSync(fileName, "utf8");
    run(testContent, "test_script.js");
  } catch (error) {
    console.error(error);
  }
};

const runTaskLambda = async (payload) => {
  const threeMinutes = 60 * 3 * 1000;
  const originTimestamp = Date.now() + threeMinutes;
  const lambdas = await lambda.listFunctions({}).promise();
  const desiredLambdaName = "runtask";

  const runTaskLambda = lambdas.Functions.find((lambda) => {
    const lambdaName = lambda.FunctionName.toLowerCase();
    return lambdaName.includes(
      `${stackName}-${desiredLambdaName}`.toLowerCase()
    );
  });

  const taskCount = payload.taskCount;
  const testId = payload.testId;

  const taskConfig = {
    taskCount,
    testId,
    originTimestamp,
  };

  const event = {
    FunctionName: runTaskLambda.FunctionName,
    InvocationType: "Event",
    Payload: JSON.stringify(taskConfig),
  };

  await lambda.invoke(event).promise();
};

const tasksAreRunning = async (intervalId) => {
  const desiredClusterName = `${stackName}-${clusterName}`;
  const desiredServiceName = telegrafServiceName;
  const artemisCluster = await getArtemisCluster(desiredClusterName);
  const telegrafServiceArn = await getTelegrafService(
    artemisCluster,
    desiredServiceName
  );

  const tasks = await ecs
    .listTasks({ cluster: artemisCluster, desiredStatus: "RUNNING" })
    .promise();

  if (tasks.taskArns.length === 1) {
    const runningTasks = await ecs
      .describeTasks({
        cluster: artemisCluster,
        tasks: [tasks.taskArns[0]],
      })
      .promise();

    const onlyRunningTask = runningTasks.tasks[0].taskDefinitionArn;

    console.log(onlyRunningTask);
    if (onlyRunningTask.includes("telegraf")) {
      console.log("inside the if statement");
      await ecs
        .updateService({
          cluster: artemisCluster,
          service: telegrafServiceArn,
          desiredCount: 0,
        })
        .promise();
      clearInterval(intervalId);
    }
  }
};

const stopTelegrafService = () => {
  const intervalId = setInterval(() => {
    tasksAreRunning(intervalId);
  }, 3 * 60 * 1000);
};

module.exports = { uploadTestScript, runTaskLambda, stopTelegrafService };
