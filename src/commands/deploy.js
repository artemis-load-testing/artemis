const {
  startDeployment,
  setFirstDeployToFalse,
} = require("../utilities/deployCommand.js");

function deploy() {
  (async () => {
    await startDeployment();
    await setFirstDeployToFalse();
  })();
}
deploy();
// module.exports = deploy;
