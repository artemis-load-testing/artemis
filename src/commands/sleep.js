const { stopRemainingTasksRunning } = require("../utilities/sleepCommand.js");

function sleep() {
  (async () => {
    await stopRemainingTasksRunning();
  })();
}

module.exports = sleep;
