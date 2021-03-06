const AWS = require('aws-sdk');
const execSync = require('child_process').execSync;
const userRegion = execSync('aws configure get region').toString().trim();
const chalk = require('chalk');
AWS.config.update({ region: userRegion });
const lambda = new AWS.Lambda();
const s3 = new AWS.S3();
const stackName = 'ArtemisAwsStack';
const bucketParams = { Bucket: 'artemisbucket', Key: 'grafanapublicIP.txt' };
const GRAFANA_PORT_NUM = 3000;

const runGrafanaTask = async () => {
  const lambdas = await lambda.listFunctions({}).promise();
  const desiredLambdaName = 'startgrafana';

  const runTaskLambda = lambdas.Functions.find((lambda) => {
    const lambdaName = lambda.FunctionName.toLowerCase();
    return lambdaName.includes(
      `${stackName}-${desiredLambdaName}`.toLowerCase()
    );
  });

  const event = {
    FunctionName: runTaskLambda.FunctionName,
    InvocationType: 'RequestResponse',
  };

  await lambda.invoke(event).promise();
};

const getArtemisBucket = async (desiredBucketName) => {
  const buckets = await s3.listBuckets({}).promise();
  const artemisBucket = buckets.Buckets.find((bucket) => {
    const bucketName = bucket.Name.toLowerCase();
    return bucketName.includes(
      `${stackName}-${desiredBucketName}`.toLowerCase()
    );
  });
  return artemisBucket;
};

const getGrafanaIpAddressFile = async () => {
  const bucket = await getArtemisBucket(bucketParams.Bucket);
  bucketParams.Bucket = bucket.Name;
  const bucketContents = await s3.getObject(bucketParams, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      console.log(
        chalk.cyan('Click to see the dashboard: ') +
          chalk.green(`http://${data.Body.toString()}:${GRAFANA_PORT_NUM}`)
      );
      console.log(
        chalk.cyan('Dashboard login: ') +
          chalk.yellow('artemis ') +
          chalk.cyan('- password: ') +
          chalk.yellow('api_load_testing')
      );
    }
  });
};

module.exports = { runGrafanaTask, getGrafanaIpAddressFile };
