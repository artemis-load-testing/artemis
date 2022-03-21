const AWS = require("aws-sdk");
const s3 = new AWS.S3();

exports.handler = async (event, context) => {
  const bucket = "upload-from-lambda-test";
  const fileName = "testing.json";

  const bucketParams = {
    Bucket: bucket,
    Key: fileName,
    Body: '{"test" : "test-body"}',
  };

  await s3.upload(bucketParams).promise();

  console.log("Put complete");
};

const readFile = (fileName) => promisify(_readFile)(fileName, "utf8");
