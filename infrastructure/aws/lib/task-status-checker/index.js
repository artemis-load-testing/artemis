/*
the task-status-checker AWS Lambda function checks if Amazon Elastic Container Service (Amazon ECS) tasks are already running for the same test ID. If tasks with the same test ID are found running, it causes an error. If there are no Amazon ECS tasks running in the AWS Fargate cluster, the function returns the test ID, task count, and test type.
*/

import { ECSClient } from "@aws-sdk/client-ecs";

export async function handler(event) {
  const { scenario } = event;
  const { testId, taskCount } = scenario;
  const input = {
    cluster: process.env.TASK_CLUSTER,
    desiredStatus: "RUNNING",
  };
  let currentRunningTaskCount;

  do {
    const client = new ECSClient(config);
    const command = new ListTaskCommand(input);
    const response = await client.send(command);

    currentRunningTaskCount = response.taskArns.length();
  } while (currentRunningTaskCount < taskCount);
}

// export async function handler(event) {
//   const { scenario } = event; // may be "data" instead of scenario based on SF code
//   const { testId } = scenario;

//   try {
//     let isRunning = false;
//     let runningTasks = [];

//     let param = { cluster: process.env.TASK_CLUSTER }; // include in cdk for this lambda
//     const response = await ecs.listTasks(param).promise();

//     if (response.taskArns.length > 0) {
//       const describedTasks = await ecs
//         .describeTasks({
//           cluster: process.env.TASK_CLUSTER,
//           tasks: response.taskArns,
//         })
//         .promise();

//       if (describedTasks.tasks.some((task) => task.group === testId)) {
//         isRunning = true;
//       }

//       runningTasks = runningTasks.concat(
//         describedTasks.tasks.filter((task) => task.group === testId)
//       );
//     }

//     //get number of tasks in running state
//     let numTasksRunning = runningTasks.reduce(
//       (accumulator, task) =>
//         task.lastStatus === "RUNNING" ? ++accumulator : accumulator,
//       0
//     );
//     //add 1 to match scenario total for step functions
//     // numTasksRunning++;
//     const result = { scenario, isRunning, numTasksRunning };
//     return result;
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// }
