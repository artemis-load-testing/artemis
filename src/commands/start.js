const {
  uploadTestScript,
  runTaskLambda,
  stopTelegrafService,
} = require("../utilities/startCommand.js");

function start(options) {
  const config = { testId: "abc123", taskCount: options.taskCount };
  const testScript = options.path;

  (async () => {
    const { testId, taskCount } = config;

    await uploadTestScript(testScript);
    await runTaskLambda(config);
    console.log("Your tests are currently running...");
    stopTelegrafService();
  })();
}
// start();
module.exports = start;
