const AWS = require("aws-sdk");
AWS.config.update({ region: "us-west-2" });
const lambda = new AWS.Lambda();
const stackName = "ArtemisAwsStack";

const stopGrafanaTask = async () => {
  const lambdas = await lambda.listFunctions({}).promise();
  const desiredLambdaName = "stopgrafana";

  const stopTaskLambda = lambdas.Functions.find((lambda) => {
    const lambdaName = lambda.FunctionName.toLowerCase();
    return lambdaName.includes(
      `${stackName}-${desiredLambdaName}`.toLowerCase()
    );
  });

  const event = {
    FunctionName: stopTaskLambda.FunctionName,
    InvocationType: "RequestResponse",
  };

  await lambda.invoke(event).promise();
};

module.exports = { stopGrafanaTask };
