const {
  runGrafanaTask,
  getGrafanaIpAddressFile,
} = require('../utilities/startGrafanaCommand.js');

/*
  TO IMPLEMENT
  error handling to check if a grafana task is already running
  don't let the user start another
*/

function startGrafana() {
  (async () => {
    console.log(
      'Container is spinning up... we will have URL for you shortly...'
    );
    await runGrafanaTask();
    setTimeout(async () => {
      console.log('Grafana Started');
      await getGrafanaIpAddressFile();
    }, 15000);
  })();
}

module.exports = startGrafana;
