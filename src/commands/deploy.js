const {
  startDeployment,
  setFirstDeployToFalse,
} = require('../utilities/deployCommand.js');

function deploy() {
  (async () => {
    await startDeployment();
    await setFirstDeployToFalse();
  })();
}

module.exports = deploy;
