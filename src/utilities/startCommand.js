const AWS = require("aws-sdk");
const execSync = require("child_process").execSync;
const userRegion = execSync("aws configure get region").toString().trim();
AWS.config.update({ region: userRegion });
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const fs = require("fs");
const util = require("util");
const stackName = "ArtemisAwsStack";

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

module.exports = { uploadTestScript, runTaskLambda };
