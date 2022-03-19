import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs"; // ES Modules import

exports.handler = (count) => {
  const client = new ECSClient();
  const params = {
    cluster: process.env.TASK_CLUSTER_NAME,
    taskDefinition: process.env.TASK_DEFINITION,
    count,
    launchType: "FARGATE",
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: "DISABLED",
        // subnets: [subnet1, subnet2],
      },
    },
  };

  const command = new RunTaskCommand(params);
  const response = await client.send(command);
};
