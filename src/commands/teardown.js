const { startTeardown } = require("../utilities/teardownCommand.js");

function teardown(options) {
  (async () => {
    await startTeardown(options);
  })();
}

module.exports = teardown;
