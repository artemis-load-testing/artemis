const AWS = require("aws-sdk");
const ecs = new AWS.ECS();

exports.handler = async (event) => {
  const cluster = process.env.TASK_CLUSTER;
  const allRunningTasks = await ecs.listTasks({ cluster }).promise();
  const describeAllTasks = await ecs
    .describeTasks({ cluster, tasks: allRunningTasks.taskArns })
    .promise();
  const grafanaTaskArn = describeAllTasks.tasks.filter((task) =>
    task.taskDefinitionArn.includes("ArtemisAwsStackgrafanaTaskDef")
  )[0].containers[0].taskArn;

  const params = {
    cluster,
    task: grafanaTaskArn,
  };

  try {
    await ecs.stopTask(params).promise();
    console.log("Stopped Grafana task");
  } catch (error) {
    console.log(error);
  }
};
