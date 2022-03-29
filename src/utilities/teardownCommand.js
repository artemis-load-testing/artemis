const AWS = require('aws-sdk');
const execSync = require('child_process').execSync;
const userRegion = execSync('aws configure get region').toString().trim();
const readlineSync = require('readline-sync');
const ora = require('ora-classic');
const chalk = require('chalk');
AWS.config.update({ region: userRegion });
const path = require('path');

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
      // console.log('Teardown in progress...');

      const spinner = ora(chalk.cyan('Teardown in progress...')).start();

      execSync(`cd ${cdkPath} && cdk destroy -f`, {
        encoding: 'utf-8',
      });
      // console.log('Teardown completed successfully.');
      spinner.succeed(chalk.cyan('Teardown completed successfully.'));
    } else if (confirmTeardown === 'n') {
      console.log(chalk.red('Teardown canceled.'));
    } else {
      console.log(chalk.cyan('Please provide the correct input.'));
      // setTimeout(() => console.clear(), 500); clear the console
    }
  } while (!USER_INPUT.includes(confirmTeardown));
};

module.exports = { startTeardown };
