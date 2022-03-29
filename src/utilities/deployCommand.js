const AWS = require("aws-sdk");
const execSync = require("child_process").execSync;
const userRegion = execSync("aws configure get region").toString().trim();
AWS.config.update({ region: userRegion });
const cloudformation = new AWS.CloudFormation();
const timestream = new AWS.TimestreamWrite();
const stackName = "ArtemisAwsStack";
const timestreamDbName = "artemis-db";
const fs = require("fs");

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

const getExistingArtemisDb = async () => {
  const allTimestreamDbs = await timestream.listDatabases().promise();
  const databaseDeployed = allTimestreamDbs.Databases.find((db) => {
    return db.DatabaseName === timestreamDbName;
  });
  return databaseDeployed;
};

const startDeployment = async () => {
  const stackExists = await artemisStackDeployed();
  const artemisDatabase = await getExistingArtemisDb();

  if (stackExists && !!artemisDatabase) {
    console.log("ArtemisAwsStack and artemis-db are already deployed");
  } else if (!!artemisDatabase) {
    console.log("artemis-db is already deployed.");
    console.log("Deploying ArtemisAwsStack only.");
    console.log(fs.readFileSync("../aws/config.json", "utf8"));
    execSync(
      `cd ../aws && cdk synth && cdk bootstrap && cdk deploy --require-approval never`,
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

const setFirstDeployToFalse = async () => {
  const data = '{"firstDeploy": "false"}';
  fs.writeFile("../aws/config.json", data, (err) => {
    if (err) console.log(err);
    else {
      let firstDeployStatus = JSON.parse(
        fs.readFileSync("../aws/config.json", "utf8")
      ).firstDeploy;
      console.log("File written successfully with value: ", firstDeployStatus);
    }
  });
};

module.exports = { startDeployment, setFirstDeployToFalse };
