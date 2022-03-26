import {
  // uploadTestScript,
  runGrafanaTask,
} from "../utilities/runGrafanaCommand.js";

/*
  TO IMPLEMENT
  error handling to check if a grafana task is already running
  don't let the user start another
*/

(async () => {
  await runGrafanaTask();
  setTimeout(() => {
    console.log("Grafana Started");
  }, 5000);
})();
