const AWS = require("aws-sdk");
const execSync = require("child_process").execSync;
const userRegion = execSync("aws configure get region").toString().trim();
AWS.config.update({ region: userRegion });
const cloudformation = new AWS.CloudFormation();
const timestream = new AWS.TimestreamWrite();
const stackName = "ArtemisAwsStack";
const timestreamDbName = "artemis-db";

/*
- Get list of stack names and look for `ArtemisAwsStack`
    - `cdk list` (`ls`) - Lists the stacks in the app
- If they already have a ArtemisAWSStack
    - Don’t redeploy
- If no ArtemisAWSStack AND no database named `artemis-db`
    - Deploy everything
- If just database `artemis-db`
    - Deploy everything but the `artemis-db` database
*/
const artemisStackDeployed = async () => {
  const allStacks = await cloudformation.describeStacks().promise();
  const stackDeployed = !!allStacks.Stacks.find((stack) => {
    return stack.StackName === stackName;
  });
  return stackDeployed;
};

const checkForExistingArtemisDb = async () => {
  const allTimestreamDbs = await timestream.listDatabases().promise();
  const databaseDeployed = !!allTimestreamDbs.Databases.find((db) => {
    return db.DatabaseName === timestreamDbName;
  });
  return databaseDeployed;
};

const startDeployment = async () => {
  const stackExists = await artemisStackDeployed();
  const artemisDatabaseExists = await checkForExistingArtemisDb();

  if (stackExists && artemisDatabaseExists) {
    console.log("ArtemisAwsStack and artemis-db are already deployed");
  } else if (artemisDatabaseExists) {
    console.log("artemis-db is already deployed.");
    console.log("Deploying ArtemisAwsStack only.");
    execSync(
      "cd ../aws && cdk synth && cdk bootstrap && cdk deploy --require-approval never",
      {
        encoding: "utf-8",
      }
    );
  } else {
    console.log("Deploying ArtemisAwsStack and artemis-db");
    execSync(
      "cd ../aws && cdk synth && cdk bootstrap && cdk deploy --require-approval never",
      {
        encoding: "utf-8",
      }
    );
  }
};

startDeployment();
// module.exports = { startDeployment };
