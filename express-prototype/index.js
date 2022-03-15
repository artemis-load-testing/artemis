const express = require('express');

const app = express();
const port = 3005;

// test runner setup
const aws = require('aws-sdk');
const { DeleteObjectCommand, S3Client } = require('@aws-sdk/client-s3');

const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

let testCompleted = false;

// define API to interact with container
app.get('/', (request, response) => {
  response.json({ sanityCheck: 'Hello world' }).status(200);
});

app.get('/status', (request, response) => {
  response.json({ container: 'ready' }).status(200);
});

app.get('/isTestComplete', (request, response) => {
  testCompleted
    ? response.json({ testStatus: 'completed' }).status(200)
    : response.json({ testStatus: 'not completed' }).status(200);
});

// endpoint that runs the test
app.get('/run', async (request, response) => {
  response.json({ container: 'test running' }).status(200);

  const s3 = new aws.S3();

  const REGION = 'us-west-2';
  const s3Client = new S3Client({ region: REGION });

  const fileName = 'script.js';
  const BUCKET = 'k6-test-storage-bin-1';

  const uniqueId = (len) => {
    return [...Array(len)]
      .map(() => Math.random().toString(36)[2])
      .join('')
      .toUpperCase();
  };

  const fetchObject = async (fileName) => {
    try {
      const response = await s3
        .getObject({
          Bucket: BUCKET,
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

  const pushObject = async () => {
    // const results = fs.readFileSync('results.json', 'utf-8');
    // const resultName = `results-${uniqueId(8)}-${Date.now()}.json`;
    const results = fs.readFileSync('results.csv', 'utf-8');
    const resultName = `results-${uniqueId(8)}-${Date.now()}.csv`;
    const params = {
      Bucket: BUCKET,
      Key: resultName,
      Body: results,
    };

    try {
      await s3.upload(params).promise();
      console.log('Test results uploaded to S3!');
    } catch (e) {
      console.log(e);
    }
  };

  const removeObject = async () => {
    const params = {
      Bucket: BUCKET,
      Key: 'script.js',
    };

    try {
      await s3Client.send(new DeleteObjectCommand(params));
      console.log('Success. Object deleted.');
    } catch (err) {
      console.log('Error', err);
    }
  };

  const runTest = async () => {
    try {
      // const output = await exec('k6 run --out json=results.json script.js');
      const output = await exec('k6 run --out csv=results.csv script.js');
      console.log(output.stdout);
      console.log('Test finished running!');
    } catch (e) {
      console.log(e);
    }
  };

  const fetchScriptAndRun = async () => {
    await fetchObject(fileName);
    await runTest();
    await pushObject();
    await removeObject();
  };

  await fetchScriptAndRun();
  testCompleted = true;
});

app.get('/stop', (request, response) => {
  response.json({ container: 'stopping' }).status(200);
  // logic to stop server so docker container finish
  server.close((err) => {
    console.log(
      'test finished, closing server instance to allow container to close'
    );
    process.exit(err ? 1 : 0);
  });
});

const server = app.listen(port, () =>
  console.log(`App running on port ${port}.`)
);
