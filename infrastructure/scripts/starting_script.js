// import uploadTestScript from "./upload_test_script.js";
import uploadScript from "./upload_script.js";
// import runTask from "./run_task.js";
// import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda"; // ES Modules import
// const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda"); // CommonJS import

// import { config } from "./config.json" assert { type: "json" };
// const client = new SFNClient();

const config = { testId: "abc123", taskCount: 3 };
const testScript = "./script.js";

// const STATE_MACHINE_ARN =
//   "arn:aws:states:us-east-1:212969361077:stateMachine:TaskStepFunctions58F28DDC-ZhI3vX1V9Mmj";

(async () => {
  const { testId, taskCount } = config;

  await uploadScript(testScript);
  // await runStartingLambda();
  // runTask(taskCount);

  const lambdaClient = new LambdaClient();

  const input = {
    FunctionName:
      "arn:aws:lambda:us-east-1:212969361077:function:AwsStack-runtask17F4DC48-6eJL3tX5uYZ1",
    InvocationType: "Event",
    // Payload: { count: taskCount },
  };

  const command = new InvokeCommand(input);
  console.log("before send!");
  await lambdaClient.send(command);

  // const command = new StartExecutionCommand({
  //   stateMachineArn: STATE_MACHINE_ARN, // add as env var
  //   input: JSON.stringify({
  //     scenario: {
  //       // imported from config file
  //       testId,
  //       taskCount,
  //     },
  //   }),
  // });

  // await client.send(command);
})();
