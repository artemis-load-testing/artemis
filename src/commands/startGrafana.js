const {
  runGrafanaTask,
  getGrafanaIpAddressFile,
} = require('../utilities/startGrafanaCommand.js');

const ora = require('ora-classic');
const chalk = require('chalk');

/*
  TO IMPLEMENT
  error handling to check if a grafana task is already running
  don't let the user start another
*/

function startGrafana() {
  (async () => {
    const spinner = ora(
      chalk.cyan('Container is spinning up, URL incoming...')
    ).start();

    spinner.color = 'yellow';

    await runGrafanaTask();
    setTimeout(async () => {
      spinner.succeed(chalk.cyan('Grafana Started'));
      await getGrafanaIpAddressFile();
    }, 15000);
  })();
}

module.exports = startGrafana;
