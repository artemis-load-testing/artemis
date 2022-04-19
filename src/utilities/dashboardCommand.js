const path = require("path");
const execSync = require("child_process").execSync;
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const dashboardPath = path.join(
  __dirname,
  "../../../artemis-admin-dashboard/api/build"
);
const open = require("open");
const filepathEscaped = dashboardPath.replace(/ /g, "\\ ");

const startDashboard = async () => {
  exec(`cd ${filepathEscaped} && npm start`);
  await open("http://localhost:9000");
};

module.exports = { startDashboard };