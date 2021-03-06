const gradient = require('gradient-string');

const {
  uploadTestScript,
  runTaskLambda,
} = require('../utilities/startCommand.js');

const { randomId } = require('../aws/utilities/randomId.js');

const { logo } = require('../constants/logo.js');

const ora = require('ora-classic');
const chalk = require('chalk');

function start(options) {
  const config = { testId: randomId(8), taskCount: options.taskCount };
  const testScript = options.path;

  (async () => {
    const { testId, taskCount } = config;

    console.log(gradient.summer(logo));

    await uploadTestScript(testScript);
    console.log(chalk.green('Test script successfully uploaded.'));
    const spinner = ora(
      chalk.cyan(
        'Spinning up test containers, this will take about three minutes...'
      )
    ).start();
    spinner.color = 'yellow';
    await runTaskLambda(config);
    setTimeout(() => {
      spinner.succeed(
        chalk.cyan(
          'Test started, your unique test ID is ' +
            chalk.yellow(`${testId}`) +
            '.\nYou can begin visualizing results.'
        )
      );
    }, 180000);
  })();
}

module.exports = start;
