![Artemis logo](https://github.com/artemis-load-testing/artemis/blob/HEAD/assets/images/Artemis_logo_color.png)

**Artemis is an open-source, serverless framework for scalable load testing of your APIs.**

---

### Artemis requires:

- an [AWS account](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html?nc2=h_ct&src=default)
- `npm` [installed](https://www.npmjs.com/get-npm)
- AWS CLI [installed](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) and configured
- [AWS named profile](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html)
- AWS CDK command-line tool [installed](https://docs.aws.amazon.com/cdk/latest/guide/cli.html)

### Installation

- run `npm install -g artemis-load-testing`
- run `artemis help` to see a list of available commands

### Usage

```
$ artemis help
Usage: artemis [options] [command]

Artemis API Load Testing CLI

Options:
  -h, --help          display help for command

Commands:
  run-test [options]  Run the test script concurrently this number of times.
  grafana-start       Start the Artemis Grafana dashboard
  grafana-stop        Stop the Artemis Grafana dashboard
  deploy              Deploy Artemis infrastructure on user's AWS account.
  sleep               Stop all support container tasks for minimal AWS usage charges.
  teardown            Teardown Artemis infrastructure on user's AWS account, retain database.
  help [command]      display help for command
```

### Login details for Artemis' Grafana dashboard:

username: `artemis`
password: `api_load_testing`
