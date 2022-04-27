#!/usr/bin/env node

const cli = require('commander');
const start = require('./commands/start.js');
const startGrafana = require('./commands/startGrafana.js');
const stopGrafana = require('./commands/stopGrafana.js');
const deploy = require('./commands/deploy.js');
const teardown = require('./commands/teardown.js');
const sleep = require('./commands/sleep.js');
const destroyDb = require('./commands/destroydb.js');
const dashboard = require('./commands/dashboard.js');

cli.description('Artemis API Load Testing CLI');
cli.name('artemis');

cli
  .command('run-test')
  .requiredOption('-tc, --taskCount <number>', 'Task count.')
  .requiredOption('-p, --path <path>', 'Relative path to test script file')
  .description('Run the test script concurrently this number of times.')
  .action(start);

cli
  .command('grafana-start')
  .description('Start the Artemis Grafana dashboard.')
  .action(startGrafana);

cli
  .command('grafana-stop')
  .description('Stop the Artemis Grafana dashboard.')
  .action(stopGrafana);

cli
  .command('deploy')
  .description("Deploy Artemis infrastructure on the user's AWS account.")
  .action(deploy);

cli
  .command('sleep')
  .description(
    'Stop all support container tasks for minimal AWS usage charges.'
  )
  .action(sleep);

cli
  .command('teardown')
  .option('-y, --yes', 'Execute teardown without user confirmation.')
  .description(
    "Teardown Artemis infrastructure on user's AWS account, retain Artemis database."
  )
  .action(teardown);

cli
  .command('destroy-db')
  .option('-y, --yes', 'Execute destroy database without user confirmation.')
  .description('Delete the Artemis database.')
  .action(destroyDb);

cli
  .command('admin-dashboard')
  .description('Start admin dashboard GUI.')
  .action(dashboard);

cli.parse(process.argv);
