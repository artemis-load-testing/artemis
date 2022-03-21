const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const fs = require("fs");
const util = require("util");

const createBucket = async (bucketParams) => {
  try {
    s3.createBucket(bucketParams);
  } catch (err) {
    console.log(err);
  }
};

const uploadToBucket = async (bucketParams) => {
  try {
    await s3.upload(bucketParams).promise();
  } catch (err) {
    console.log(err);
  }
};

const run = async (testContent, key) => {
  const params = {
    Bucket: "artemis7-bucket",
    Key: key,
    Body: testContent,
  };

  createBucket(params);
  uploadToBucket(params);
};

// const readFile = (fileName) => util.promisify(fs.readFile)(fileName, "utf8");

const uploadTestScript = async (fileName) => {
  try {
    let testContent = fs.readFileSync(fileName, "utf8");
    run(testContent, fileName);
  } catch (error) {
    console.error(error);
  }
};

const runTaskLambda = async () => {
  const params = {
    FunctionName:
      "arn:aws:lambda:us-east-1:212969361077:function:AwsStack-runtask17F4DC48-6eJL3tX5uYZ1",
    InvocationType: "Event",
    // Payload: { count: taskCount },
  };

  await lambda.invoke(params).promise();
};

module.exports = { uploadTestScript, runTaskLambda };
