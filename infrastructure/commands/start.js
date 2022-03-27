const {
  uploadTestScript,
  runTaskLambda,
} = require('../utilities/startCommand.js');

function start(options) {
  const config = { testId: 'abc123', taskCount: options.taskCount };
  const testScript = options.path;

  (async () => {
    const { testId, taskCount } = config;

    await uploadTestScript(testScript);
    await runTaskLambda(config);
  })();
}

module.exports = start;
