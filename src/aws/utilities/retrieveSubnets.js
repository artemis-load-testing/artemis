const AWS = require("aws-sdk");
const ec2 = new AWS.EC2();

const retrieveSubnets = async (vpcId) => {
  const params = {
    Filters: [
      {
        Name: "vpc-id",
        Values: [vpcId],
      },
    ],
  };

  const subnets = await ec2.describeSubnets(params).promise();
  const subnetIds = subnets.Subnets.map((subnet) => subnet.SubnetId);
  return [subnetIds[0]];
};

module.exports = { retrieveSubnets };
