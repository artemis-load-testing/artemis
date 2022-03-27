const aws = require('aws-sdk');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const fs = require("fs");
const s3 = new aws.S3();

/*
PROBLEM: Write app that adds script to s3 bucket and then runs predefined test

AWS CLI COMMAND (turn this into SDK syntax): aws ecs run-task \
--launch-type FARGATE \
--count 1 \
--task-definition script-and-k6:1 \
--cluster k6-test-cluster \
--network-configuration "awsvpcConfiguration={subnets=[subnet-06c8bcb80eaab0304],securityGroups=[sg-02c073e2c6395207d],assignPublicIp=ENABLED}"
*/

const scriptName = process.argv[2]
const testCount = process.argv[3];

const runTestCommand = `aws ecs run-task \
--launch-type FARGATE \
--count ${testCount} \
--task-definition script-and-k6:1 \
--cluster k6-test-cluster \
--network-configuration "awsvpcConfiguration={subnets=[subnet-06c8bcb80eaab0304],securityGroups=[sg-02c073e2c6395207d],assignPublicIp=ENABLED}"`

const uploadScript = async (fileName) => {
  const contents = fs.readFileSync(fileName, "utf-8");
  const params = {
    Bucket: 'k6-test-storage',
    Key: 'script.js',
    Body: contents
  }

  try {
    await s3.upload(params).promise();
    console.log('Script uploaded to S3!');
  } catch(e) {
    console.log(e);
  }
}

const uploadScriptAndRunTests = async () => {
  try {
    console.log(process.argv);
    await uploadScript(scriptName);
    await exec(runTestCommand);
    console.log('Running Task(s)!');
  } catch (e) {
    console.log(e);
  }
}

uploadScriptAndRunTests();