import {
  runGrafanaTask,
  getGrafanaIpAddressFile,
} from "../utilities/startGrafanaCommand.js";

/*
  TO IMPLEMENT
  error handling to check if a grafana task is already running
  don't let the user start another
*/

(async () => {
  await runGrafanaTask();
  setTimeout(async () => {
    console.log("Grafana Started");
    await getGrafanaIpAddressFile();
  }, 8000);
})();
