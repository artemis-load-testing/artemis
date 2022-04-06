import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_servicediscovery as servicediscovery,
  Duration,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class TelegrafService extends Construct {
  fargateService: ecs.FargateService;

  constructor(scope: Construct, id: string, props?: any) {
    super(scope, id);
    const telegrafSG = new ec2.SecurityGroup(this, "telegrafSG", {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: "security group for telegraf",
    });

    telegrafSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "allow HTTP access from anywhere"
    );

    telegrafSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8186),
      "allow 8186 access from anywhere"
    );

    this.fargateService = new ecs.FargateService(this, "artemis-telegraf", {
      cluster: props.cluster,
      taskDefinition: props.taskDefinition,
      desiredCount: 0,
      serviceName: "artemis-telegraf",
      cloudMapOptions: {
        cloudMapNamespace: props.cluster.addDefaultCloudMapNamespace({
          name: "artemis",
        }),
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: Duration.seconds(60),
        name: "artemis-telegraf",
      },
      assignPublicIp: true,
      securityGroups: [telegrafSG],
    });
  }
}
