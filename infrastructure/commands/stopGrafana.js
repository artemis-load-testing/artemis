import { stopGrafanaTask } from "../utilities/stopGrafanaCommand.js";

(async () => {
  await stopGrafanaTask();
  setTimeout(() => {
    console.log("Grafana Stopped");
  }, 10000);
})();
