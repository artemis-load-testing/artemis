const { stopGrafanaTask } = require('../utilities/stopGrafanaCommand.js');

function stopGrafana() {
  (async () => {
    console.log(
      'Container is shutting down... we will have shutdown confirmation for you shortly...'
    );
    await stopGrafanaTask();
    setTimeout(() => {
      console.log('Grafana Stopped');
    }, 10000);
  })();
}

module.exports = stopGrafana;
