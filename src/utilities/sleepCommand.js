const AWS = require('aws-sdk');
const execSync = require('child_process').execSync;
const userRegion = execSync('aws configure get region').toString().trim();
AWS.config.update({ region: userRegion });
const ecs = new AWS.ECS();
const stackName = 'ArtemisAwsStack';
const clusterName = 'artemisvpccluster';
const telegrafServiceName = 'artemis-telegraf';

const ora = require('ora-classic');
const chalk = require('chalk');

const getArtemisCluster = async (desiredClusterName) => {
  const clusters = await ecs.listClusters({}).promise();
  const artemisCluster = clusters.clusterArns.find((clusterArn) => {
    return clusterArn.includes(desiredClusterName);
  });
  return artemisCluster;
};

const getTelegrafService = async (cluster, desiredServiceName) => {
  const services = await ecs.listServices({ cluster }).promise();
  const telegrafService = services.serviceArns.find((serviceArn) => {
    return serviceArn.includes(desiredServiceName);
  });
  return telegrafService;
};

const getRunningTasks = async (artemisCluster) => {
  return await ecs
    .listTasks({ cluster: artemisCluster, desiredStatus: 'RUNNING' })
    .promise();
};

const stopTelegrafService = async (artemisCluster, telegrafServiceArn) => {
  await ecs
    .updateService({
      cluster: artemisCluster,
      service: telegrafServiceArn,
      desiredCount: 0,
    })
    .promise();
};

const stopGrafanaTask = async (artemisCluster, grafanaTaskArn) => {
  await ecs
    .stopTask({ cluster: artemisCluster, task: grafanaTaskArn })
    .promise();
};

const onlyTelegrafAndGrafanaRunning = async (
  firstRunningTaskArn,
  secondRunningTaskArn
) => {
  if (
    (firstRunningTaskArn.includes('telegraf') &&
      secondRunningTaskArn.includes('grafana')) ||
    (firstRunningTaskArn.includes('grafana') &&
      secondRunningTaskArn.includes('telegraf'))
  ) {
    return true;
  } else {
    return false;
  }
};

const stopRemainingTasksRunning = async () => {
  const desiredClusterName = `${stackName}-${clusterName}`;
  const desiredServiceName = telegrafServiceName;
  const artemisCluster = await getArtemisCluster(desiredClusterName);
  const telegrafServiceArn = await getTelegrafService(
    artemisCluster,
    desiredServiceName
  );
  const tasks = await getRunningTasks(artemisCluster);
  const numberOfRunningTasks = tasks.taskArns.length;

  if (numberOfRunningTasks === 1) {
    const runningTasks = await ecs
      .describeTasks({
        cluster: artemisCluster,
        tasks: [tasks.taskArns[0]],
      })
      .promise();

    const onlyRunningTask = runningTasks.tasks[0].taskDefinitionArn;
    if (onlyRunningTask.includes('telegraf')) {
      const spinnerTelegrafOne = ora(
        chalk.cyan('Stopping Telegraf...')
      ).start();
      spinnerTelegrafOne.color = 'yellow';
      await stopTelegrafService(artemisCluster, telegrafServiceArn);
      spinnerTelegrafOne.succeed(chalk.cyan('Telegraf successfully stopped.'));
    } else if (onlyRunningTask.includes('grafana')) {
      const spinnerGrafanaOne = ora(chalk.cyan('Stopping Grafana...')).start();
      spinnerGrafanaOne.color = 'yellow';

      const grafanaTaskArn = runningTasks.tasks[0].taskArn;
      await stopGrafanaTask(artemisCluster, grafanaTaskArn);
      spinnerGrafanaOne.succeed(chalk.cyan('Grafana successfully stopped.'));
    }
  } else if (numberOfRunningTasks === 2) {
    const runningTasks = await ecs
      .describeTasks({
        cluster: artemisCluster,
        tasks: [tasks.taskArns[0], tasks.taskArns[1]],
      })
      .promise();
    const firstRunningTaskArn = runningTasks.tasks[0].taskDefinitionArn;
    const secondRunningTaskArn = runningTasks.tasks[1].taskDefinitionArn;

    if (
      onlyTelegrafAndGrafanaRunning(firstRunningTaskArn, secondRunningTaskArn)
    ) {
      const spinnerTelegrafTwo = ora(
        chalk.cyan('Stopping Telegraf...')
      ).start();
      spinnerTelegrafTwo.color = 'yellow';
      await stopTelegrafService(artemisCluster, telegrafServiceArn);
      spinnerTelegrafTwo.succeed(chalk.cyan('Telegraf successfully stopped.'));
      const spinnerGrafanaTwo = ora(chalk.cyan('Stopping Grafana...')).start();
      spinnerGrafanaTwo.color = 'yellow';

      const grafanaTaskArn = runningTasks.tasks[0].taskArn;
      await stopGrafanaTask(artemisCluster, grafanaTaskArn);

      // bug fix, look for a more elegant solution
      const grafanaTaskArnOther = runningTasks.tasks[1].taskArn;
      await stopGrafanaTask(artemisCluster, grafanaTaskArnOther);

      spinnerGrafanaTwo.succeed(chalk.cyan('Grafana successfully stopped.'));
    }
  }
};

module.exports = { stopRemainingTasksRunning };
