const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" }); // pull region from credentials
const lambda = new AWS.Lambda();
const stackName = "ArtemisAwsStack";

const runGrafanaTask = async () => {
  const lambdas = await lambda.listFunctions({}).promise();
  const desiredLambdaName = "rungrafana";

  const runTaskLambda = lambdas.Functions.find((lambda) => {
    const lambdaName = lambda.FunctionName.toLowerCase();
    return lambdaName.includes(
      `${stackName}-${desiredLambdaName}`.toLowerCase()
    );
  });

  const event = {
    FunctionName: runTaskLambda.FunctionName,
    InvocationType: "RequestResponse",
  };

  await lambda.invoke(event).promise();
};

module.exports = { runGrafanaTask };
