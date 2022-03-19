const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
// const { s3Client } = require("./libs/s3Client.js";
const { readFile } = require("fs");
const { promisify } = require("util");

const fileName = "./script.js";

// import { S3Client } from "@aws-sdk/client-s3"

// const REGION = "us-west-2";
// const s3Client = new S3Client({ region: REGION });
// export { s3Client };

exports.handler = async () => {
  const run = async (testContent, key) => {
    const params = {
      Bucket: "team-7-bucket",
      Key: key,
      Body: testContent,
    };

    try {
      await S3Client.send(new PutObjectCommand(params));
      console.log(
        "Successfully created " +
          params.Key +
          " and uploaded it to " +
          params.Bucket +
          "/" +
          params.Key
      );
    } catch (err) {
      console.log("Error", err);
    }
  };

  const readFile = (fileName) => promisify(_readFile)(fileName, "utf8");

  async function uploadTestScript(fileName) {
    try {
      let testContent = await readFile(fileName);
      run(testContent, fileName);
    } catch (error) {
      console.error(error);
    }
  }

  uploadTestScript(fileName);
};
