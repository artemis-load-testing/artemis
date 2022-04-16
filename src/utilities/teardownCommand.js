const AWS = require("aws-sdk");
const execSync = require("child_process").execSync;
const userRegion = execSync("aws configure get region").toString().trim();
const readlineSync = require("readline-sync");
const ora = require("ora-classic");
const chalk = require("chalk");
AWS.config.update({ region: userRegion });
const path = require("path");

const { promisify } = require("util");
const sleep = require("../commands/sleep.js");
const exec = promisify(require("child_process").exec);

const cdkPathEscaped = path.join(__dirname, "../aws").replace(/ /g, "\\ ");

const pause = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time)); // in ms
};

const startTeardown = async (options) => {
  const USER_INPUT = ["y", "n", "yes", "no"];
  let confirmTeardown;

  if (options.yes) {
    await exec(`cd ${cdkPathEscaped} && cdk destroy -f`, {
      encoding: "utf-8",
    });
  } else {
    do {
      confirmTeardown = readlineSync.question(
        chalk.cyan("Are you sure you want to perform a teardown? (y/n)\n")
      );
      confirmTeardown = confirmTeardown.toLowerCase().trim();

      if (
        USER_INPUT.includes(confirmTeardown) &&
        confirmTeardown.startsWith("y")
      ) {
        await sleep();
        const spinner = ora(chalk.cyan("Teardown in progress...")).start();
        spinner.color = "yellow";

        await exec(`cd ${cdkPathEscaped} && cdk destroy -f`, {
          encoding: "utf-8",
        });
        spinner.succeed(chalk.cyan("Teardown completed successfully."));
      } else if (
        USER_INPUT.includes(confirmTeardown) &&
        confirmTeardown.startsWith("n")
      ) {
        console.log(chalk.yellow("Teardown canceled."));
      } else {
        console.log(chalk.cyan("Please provide the correct input."));
        await pause(1500);
        console.clear();
      }
    } while (!USER_INPUT.includes(confirmTeardown));
  }
};

module.exports = { startTeardown };
