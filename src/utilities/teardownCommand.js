const AWS = require("aws-sdk");
const execSync = require("child_process").execSync;
const userRegion = execSync("aws configure get region").toString().trim();
const readlineSync = require("readline-sync");
AWS.config.update({ region: userRegion });

const startTeardown = async () => {
  const USER_INPUT = ["y", "n"];
  let confirmTeardown;

  do {
    confirmTeardown = readlineSync.question(
      "Are you sure you want to perform a teardown? (y/n)\n"
    );
    confirmTeardown = confirmTeardown.toLowerCase().trim();

    if (confirmTeardown === "y") {
      console.log("Teardown in progress...");
      execSync("cd ../aws && cdk destroy -f", {
        encoding: "utf-8",
      });
      console.log("Teardown completed successfully.");
    } else if (confirmTeardown === "n") {
      console.log("Teardown canceled.");
    } else {
      console.log("Please provide the correct input.");
      // setTimeout(() => console.clear(), 500); clear the console
    }
  } while (!USER_INPUT.includes(confirmTeardown));
};

module.exports = { startTeardown };
