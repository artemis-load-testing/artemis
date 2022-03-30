const { startTeardown } = require('../utilities/teardownCommand.js');

function teardown() {
  (async () => {
    await startTeardown();
  })();
}

module.exports = teardown;
