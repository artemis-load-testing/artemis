#!/usr/bin/env node

const cli = require('commander');
const start = require('./commands/start.js');
const startGrafana = require('./commands/startGrafana.js');
const stopGrafana = require('./commands/stopGrafana.js');
const deploy = require('./commands/deploy.js');

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
  .description("Start Artemis' Grafana dashboard")
  .action(startGrafana);

cli
  .command('grafana-stop')
  .description("Stop Artemis' Grafana dashboard")
  .action(stopGrafana);

cli
  .command('deploy')
  .description("Deploy Artemis infrastructure on user's AWS account.")
  .action(deploy);

cli.parse(process.argv);
