const path = require('path');
const execSync = require('child_process').execSync;
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const ora = require('ora-classic');
const chalk = require('chalk');
const dashboardPath = path.join(__dirname, '../../admin-dashboard/api/build');
const open = require('open');
const filepathEscaped = dashboardPath.replace(/ /g, '\\ ');

const startDashboard = async () => {
  exec(`cd ${filepathEscaped} && npm start`);
  const spinner = ora(chalk.cyan('Launching admin dashboard...')).start();
  spinner.color = 'yellow';
  setTimeout(() => {
    open('http://localhost:9000');
    spinner.succeed(
      chalk.cyan(
        'Admin dashboard running in the browser at http://localhost:9000.'
      )
    );
    console.log(chalk.green('Ctrl-C to stop the admin dashboard.'));
  }, 5000);
};

module.exports = { startDashboard };
