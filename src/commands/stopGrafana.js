const { stopGrafanaTask } = require('../utilities/stopGrafanaCommand.js');
const ora = require('ora-classic');
const chalk = require('chalk');

function stopGrafana() {
  (async () => {
    const spinner = ora(chalk.cyan('Container is shutting down...')).start();

    spinner.color = 'yellow';

    await stopGrafanaTask();
    setTimeout(() => {
      spinner.succeed(chalk.cyan('Grafana Stopped'));
    }, 10000);
  })();
}

module.exports = stopGrafana;
