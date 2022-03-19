const aws = require('aws-sdk');
const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const s3 = new aws.S3();
const fileName = 'script.js';

const fetchObject = async (fileName) => {
  try {
    const response = await s3
      .getObject({
        Bucket: 'k6-test-storage-bin-1',
        Key: fileName,
      })
      .promise();

    const content = response.Body.toString('utf-8');

    fs.writeFile('script.js', content, 'utf8', function (err) {
      if (err) {
        return console.log(err);
      }
      console.log('The file was saved!');
    });
  } catch (e) {
    console.log(e);
  }
};

const runTest = async () => {
  try {
    console.log('I am about to run, will this work? Wait to find out...');
    // const output = await exec('k6 run --out influxdb=http://54.202.242.79:8186 script.js');
    const output = await exec(
      'k6 run --out influxdb=http://artemis-telegraf.artemis:8186 script.js'
    );
    console.log(output.stdout);
    console.log('Test finished running!');
  } catch (e) {
    console.log(e);
  }
};

const fetchScriptAndRun = async () => {
  await fetchObject(fileName);
  await runTest();
};

fetchScriptAndRun();
