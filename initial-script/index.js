const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

/*
PROBLEM: Write app that adds script to s3 bucket and then runs predefined test

AWS CLI COMMAND (turn this into SDK syntax): aws ecs run-task \
--launch-type FARGATE \
--count 1 \
--task-definition script-and-k6:1 \
--cluster k6-test-cluster \
--network-configuration "awsvpcConfiguration={subnets=[subnet-06c8bcb80eaab0304],securityGroups=[sg-02c073e2c6395207d],assignPublicIp=ENABLED}"
*/

const testCount = process.argv[2];

const runTestCommand = `aws ecs run-task \
--launch-type FARGATE \
--count ${testCount} \
--task-definition script-and-k6:1 \
--cluster k6-test-cluster \
--network-configuration "awsvpcConfiguration={subnets=[subnet-06c8bcb80eaab0304],securityGroups=[sg-02c073e2c6395207d],assignPublicIp=ENABLED}"`

const uploadScriptAndRunTests = async () => {
  try {
    // await uploadScript();
    await exec(runTestCommand);
    console.log('Running Task(s)!');
  } catch (e) {
    console.log(e);
  }
}

uploadScriptAndRunTests();
