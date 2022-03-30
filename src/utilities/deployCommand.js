const AWS = require('aws-sdk');
const execSync = require('child_process').execSync;
const userRegion = execSync('aws configure get region').toString().trim();
AWS.config.update({ region: userRegion });
const cloudformation = new AWS.CloudFormation();
const timestream = new AWS.TimestreamWrite();
const stackName = 'ArtemisAwsStack';
const timestreamDbName = 'artemis-db';
const fs = require('fs');
const path = require('path');

const ora = require('ora-classic');
const chalk = require('chalk');

const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

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

const cdkPath = path.join(__dirname, '../aws');

const startDeployment = async () => {
  const stackExists = await artemisStackDeployed();
  const artemisDatabase = await getExistingArtemisDb();

  if (stackExists && !!artemisDatabase) {
    console.log('ArtemisAwsStack and artemis-db are already deployed.');
  } else if (!!artemisDatabase) {
    console.log(chalk.green('Your artemis-db is already deployed.'));
    const spinner = ora(
      chalk.cyan('Deploying ArtemisAwsStack only...')
    ).start();

    spinner.color = 'yellow';
    fs.readFileSync(`${cdkPath}/config.json`, 'utf8');

    await exec(
      `cd ${cdkPath} && cdk synth && cdk bootstrap && cdk deploy --require-approval never`,
      {
        encoding: 'utf-8',
      }
    );

    spinner.succeed(
      chalk.cyan('Artemis infrastructure on AWS successfully deployed.')
    );
  } else {
    const spinner = ora(
      chalk.cyan('Deploying ArtemisAwsStack and artemis-db...')
    ).start();

    spinner.color = 'yellow';

    await exec(
      `cd ${cdkPath} && cdk synth && cdk bootstrap && cdk deploy --require-approval never`,
      {
        encoding: 'utf-8',
      }
    );

    spinner.succeed(
      chalk.cyan('Artemis infrastructure on AWS successfully deployed.')
    );
  }
};

const setFirstDeployToFalse = async () => {
  const data = '{"firstDeploy": "false"}';
  fs.writeFile(`${cdkPath}/config.json`, data, (err) => {
    if (err) console.log(err);
    else {
      let firstDeployStatus = JSON.parse(
        fs.readFileSync(`${cdkPath}/config.json`, 'utf8')
      ).firstDeploy;
      // console.log('File written successfully with value: ', firstDeployStatus);
    }
  });
};

module.exports = { startDeployment, setFirstDeployToFalse };
