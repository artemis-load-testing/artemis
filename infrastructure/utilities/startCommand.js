const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" }); // pull region from credentials
const s3 = new AWS.S3();
const ecs = new AWS.ECS();
const ec2 = new AWS.EC2();
const lambda = new AWS.Lambda();
const fs = require("fs");
const util = require("util");
const stackName = "ArtemisAwsStack";

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

const getECSCluster = async (desiredClusterName) => {
  const clusters = await ecs.listClusters({}).promise();
  // console.log(clusters);
  const artemisCluster = clusters.clusterArns.find((clusterArn) => {
    return clusterArn
      .toLowerCase()
      .includes(`${stackName}-${desiredClusterName}`.toLowerCase());
  });
  return artemisCluster;
};

const getGrafanaTaskDefinition = async (desiredGrafanaTaskName) => {
  const taskDefinitions = await ecs.listTaskDefinitions({}).promise();
  const grafanaTaskDefinition = taskDefinitions.taskDefinitionArns.find(
    (taskDef) => {
      return taskDef
        .toLowerCase()
        .includes(`${stackName}${desiredGrafanaTaskName}`.toLowerCase());
    }
  );
  return grafanaTaskDefinition;
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
    Bucket: "artemis7bucket",
    Key: key,
    Body: testContent,
  };

  // await createBucket({ Bucket: params.Bucket });
  await uploadToBucket(params);
};

// const readFile = (fileName) => util.promisify(fs.readFile)(fileName, "utf8");

const uploadTestScript = async (fileName) => {
  try {
    /*
    Look for a file named test_script.js
    If it doesn't exist then ask the user to choose a directory or the test file.
      If the user selects a directory, then repeat recursively until a file is chosen.
      Once a file is chosen, upload the selected file.
    */
    let testContent = fs.readFileSync(fileName, "utf8");
    run(testContent, "test_script.js");
  } catch (error) {
    console.error(error);
  }
};

const runGrafanaTask = async () => {
  const cluster = await getECSCluster("artemisvpccluster");
  // console.log("cluster type:", typeof cluster);
  // const clusterDescription = await ecs
  //   .describeClusters({
  //     clusters: [cluster],
  //   })
  //   .promise();
  // console.log("cluster description:", clusterDescription);
  // const vpcId = clusterDescription["clusters"]; // cluster.vpc
  const vpcId = "vpc-01b855f9f1242e4a2";
  const taskDefinition = await getGrafanaTaskDefinition("grafanaTaskDef");
  const subnets = await retrieveSubnets(vpcId);

  // console.log(vpcId);

  const taskParams = {
    cluster,
    taskDefinition,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets,
        assignPublicIp: "ENABLED",
        securityGroups: ["sg-098a4efe777ae3f5d"],
      },
    },
  };
  await ecs.runTask(taskParams).promise();
};

const runTaskLambda = async (payload) => {
  /*
    Find the lambda with the runTask name
    Calculate the origin timestamp (current time + 3 mins)
    Pass the task count and origin timestamp in the payload
    Invoke the lambda
  */

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

  // console.log(runTaskLambda);

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
    // Payload: { count: taskCount },
  };

  await lambda.invoke(event).promise();
};

module.exports = { uploadTestScript, runGrafanaTask, runTaskLambda };
