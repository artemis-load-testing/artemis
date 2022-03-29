const AWS = require("aws-sdk");
const execSync = require("child_process").execSync;
const userRegion = execSync("aws configure get region").toString().trim();
AWS.config.update({ region: userRegion });

const startTeardown = async () => {
  // user confirmation first
  // readline.createInterface
    
  //   console.log("Delete");
  //   execSync("cd ../aws && cdk destroy", {
  //     encoding: "utf-8",
  //   });
};

module.exports = { startTeardown };
