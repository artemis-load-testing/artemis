const { startTeardown } = require("../utilities/teardownCommand.js");

function teardown() {
  (async () => {
    await startTeardown();
  })();
}
teardown();
// module.exports = teardown;
