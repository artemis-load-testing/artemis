# artemis-mvp
## Contents
- `infrastructure` folder includes the code to deploy infrastructure using CDK. (I haven't played with this yet)
- `fargate-tester` includes the code that is running within the ECS task/fargate instance. It fetches the script from s3 bucket, runs the script using k6, and uploads results to s3 bucket.
- `initial-script` is the script you run in your local machine to upload the test script and then run the tasks without having to use the AWS console/website.
## Pre-requisites
- Have required infrastructure already setup. This includes IAM credentials, VPC, AWS CLI, ECS etc. 
- The following instructions walk you through most of the process. Only difference is that for `Step 3`, you will be creating an image based on the Dockerfile in the `fargate-tester` folder: https://www.notion.so/Deploy-Docker-Container-on-ECS-455e95dd648e40c1acf88100956b2c01 
- You also need to create an s3 bucket (easy, just a couple of clicks from the AWS website).
- You need to set up a role to allow interaction with other AWS services within Fargate by following `Step 2` in these instructions: https://www.notion.so/Creating-k6-custom-image-and-assigning-role-to-call-s3-bucket-26b332ea776943169d1ae6a3c80b8ea2
## Running a test
- In the `initial-script/index.js` file, the `runTestCommand` needs to be modified to your own values for `task-definition`, `cluster`, and `network-configuration`
  - `task-definition` is just the name and revision of the task you will be running
  - `cluster` is the name of your cluster
  - For network configuration, you need to change `subnets` and `security-groups` to match yours
    - Example: awsvpcConfiguration={subnets=[subnet-`yourSubnetID`],securityGroups=[sg-`yourSecurityGroupId`],assignPublicIp=ENABLED}
    - In the VPC Dashboard, you can click on the `subnets` and `security groups` section to find these values. As far as I know, any should work.
- On the command line, type `node index.js [script name] [number of tests to run]`
- Example: `node index.js script.js 5`
- The example above will run five k6 tests using `script.js`
## Notes
- Bucket name is hardcoded into the scripts. You need to change the name to your own bucket's name.
- Script is not deleted at the end of the process. Still need to figure our how to get sdk v3 working.