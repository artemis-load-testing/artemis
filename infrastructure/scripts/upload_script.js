// // Import required AWS SDK clients and commands for Node.js.
// import { PutObjectCommand } from "@aws-sdk/client-s3";
// import { s3Client } from "./libs/s3Client.js"; // Helper function that creates an Amazon S3 service client module.
// import { path } from "path";
// import { fs } from "fs";

// const file = "OBJECT_PATH_AND_NAME"; // Path to and name of object. For example '../myFiles/index.js'.
// const fileStream = fs.createReadStream(file);

// // Set the parameters
// export const uploadParams = {
//   Bucket: "BUCKET_NAME",
//   // Add the required 'Key' parameter using the 'path' module.
//   Key: path.basename(file),
//   // Add the required 'Body' parameter
//   Body: fileStream,
// };

// // Upload file to specified bucket.
// export const run = async () => {
//   try {
//     const data = await s3Client.send(new PutObjectCommand(uploadParams));
//     console.log("Success", data);
//     return data; // For unit tests.
//   } catch (err) {
//     console.log("Error", err);
//   }
// };

// run();

import { PutObjectCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./libs/s3Client.js";
import { readFile as _readFile } from "fs";
import { promisify } from "util";

const run = async (testContent, key) => {
  const params = {
    Bucket: "team-7-bucket",
    Key: key,
    Body: testContent,
  };
  // console.log("first: ", params)

  // // Create an Amazon S3 bucket.
  // try {
  //   const data = await s3Client.send(
  //     new CreateBucketCommand({ Bucket: params.Bucket })
  //   );
  //   console.log(data);
  //   console.log("Successfully create a bucket called ", data.Location);

  // } catch (err) {
  //   console.log("Error", err);
  // }
  // Create an object and upload it to the Amazon S3 bucket.
  try {
    await s3Client.send(new PutObjectCommand(params));
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

// if (process.argv.length < 3) {
//   console.log("Usage: node " + process.argv[1] + " FILENAME");
//   process.exit(1);
// }

// let testFilename = process.argv[2];
const readFile = (fileName) => promisify(_readFile)(fileName, "utf8");

export default async function uploadTestScript(fileName) {
  try {
    let testContent = await readFile(fileName);
    // console.log("OK: " + fileName);
    // console.log(testContent);
    run(testContent, fileName);
  } catch (error) {
    console.error(error);
  }
}
