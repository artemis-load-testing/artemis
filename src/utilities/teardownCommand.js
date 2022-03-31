const AWS = require('aws-sdk');
const execSync = require('child_process').execSync;
const userRegion = execSync('aws configure get region').toString().trim();
const readlineSync = require('readline-sync');
const ora = require('ora-classic');
const chalk = require('chalk');
AWS.config.update({ region: userRegion });
const path = require('path');

const { promisify } = require('util');
const sleep = require('../commands/sleep.js');
const exec = promisify(require('child_process').exec);

const cdkPath = path.join(__dirname, '../aws');

const startTeardown = async () => {
  const USER_INPUT = ['y', 'n'];
  let confirmTeardown;

  do {
    confirmTeardown = readlineSync.question(
      chalk.cyan('Are you sure you want to perform a teardown? (y/n)\n')
    );
    confirmTeardown = confirmTeardown.toLowerCase().trim();

    if (confirmTeardown === 'y') {
      await sleep();
      const spinner = ora(chalk.cyan('Teardown in progress...')).start();
      spinner.color = 'yellow';

      await exec(`cd ${cdkPath} && cdk destroy -f`, {
        encoding: 'utf-8',
      });
      spinner.succeed(chalk.cyan('Teardown completed successfully.'));
    } else if (confirmTeardown === 'n') {
      console.log(chalk.yellow('Teardown canceled.'));
    } else {
      console.log(chalk.cyan('Please provide the correct input.'));
      // setTimeout(() => console.clear(), 500); clear the console
    }
  } while (!USER_INPUT.includes(confirmTeardown));
};

module.exports = { startTeardown };