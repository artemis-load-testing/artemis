const { startDeployment } = require("../utilities/deployCommand.js");


function deploy() {
  (async () => {
    await startDeployment();
  })();
}

module.exports = deploy;
