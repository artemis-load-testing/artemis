const aws = require('aws-sdk');
const fs = require("fs");
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const s3 = new aws.S3();
const fileName = 'script.js';

const uniqueId = (len) => {
  return [...Array(len)]
    .map(() => Math.random()
      .toString(36)[2])
    .join('')
    .toUpperCase();
}

const fetchObject = async (fileName) => {
  try {
    const response = await s3.getObject({
      Bucket: 'k6-test-storage',
      Key: fileName
    }).promise();

    const content = response.Body.toString('utf-8');

    fs.writeFile("script.js", content, 'utf8', function(err) {
      if (err) {
        return console.log(err);
      }
      console.log("The file was saved!");
    });
  } catch(e) {
    console.log(e)
  }
}

const pushObject = async () => {
  const results = fs.readFileSync('results.json', "utf-8");
  const resultName = `results-${uniqueId(8)}.json`
  const params = {
    Bucket: 'k6-test-storage',
    Key: resultName,
    Body: results
  }

  try {
    await s3.upload(params).promise();
    console.log('Test results uploaded to S3!');
  } catch(e) {
    console.log(e);
  }
}

const removeObject = async () => {
  const params = {
    Bucket: 'k6-test-storage',
    Key: 'script.js',
  };

  try {
    const data = await s3.send(new DeleteObjectCommand(params));
    console.log('Success. Object deleted.', data);
  } catch (err) {
    console.log('Error', err);
  }
};

const runTest = async () => {
  try {
    const output = await exec('k6 run --out json=results.json script.js');
    console.log(output.stdout);
    console.log('Test finished running!');
  } catch (e) {
    console.log(e);
  }
}

const fetchScriptAndRun = async () => {
  await fetchObject(fileName);
  await runTest();
  await pushObject();
  // await removeObject();
}

fetchScriptAndRun();