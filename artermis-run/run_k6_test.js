const aws = require("aws-sdk");
const fs = require("fs");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);

const s3 = new aws.S3();
const fileName = "test_script.js"; // how can we get the users file name? env variable

const fetchObject = async (fileName) => {
  try {
    const response = await s3
      .getObject({
        // Bucket: 'k6-test-storage-bin-1',
        Bucket: "super-artemis7-bucket",
        Key: fileName,
      })
      .promise();

    const content = response.Body.toString("utf-8");

    fs.writeFile("script.js", content, "utf8", function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("The file was saved!");
    });
  } catch (e) {
    console.log(e);
  }
};

const runTest = async () => {
  try {
    console.log("I am about to run, will this work? Wait to find out...");
    // const output = await exec('k6 run --out influxdb=http://54.202.242.79:8186 script.js');
    const output = await exec(
      // 'k6 run --out influxdb=http://artemis-telegraf.artemis:8186 script.js'
      "k6 run script.js"
    );
    console.log(output.stdout);
    console.log("Test finished running!");
  } catch (e) {
    console.log(e);
  }
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const fetchScriptAndRun = async () => {
  const originTimestamp = process.env.ORIGIN_TIMESTAMP;
  const currentTime = Date.now();
  const waitTime =
    currentTime < originTimestamp ? originTimestamp - currentTime : 0;

  await fetchObject(fileName);
  // setTimeout(async () => { await runTest() }, waitTime);

  async function delay() {
    console.log(
      "originTimestamp ",
      originTimestamp,
      "currentTime ",
      currentTime
    );
    await sleep(waitTime);
    await runTest();
  }
  delay();
};

fetchScriptAndRun();
