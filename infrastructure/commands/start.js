import { uploadTestScript, runTaskLambda } from "../utilities/startCommand.js";

const config = { testId: "abc123", taskCount: 3 };
const testScript = "../../artemis-demo/test_script.js";

(async () => {
  const { testId, taskCount } = config;

  await uploadTestScript(testScript);
  await runTaskLambda(config);
})();