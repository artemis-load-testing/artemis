# artemis

### current status and instructions

- package.json files consolidated to root of `infrastructure` directory, more organization coming...for now:
  - run `npm install` from `/infrastructure`
- implemented beginnings of CLI
  - from infrastructure folder run `npm i -g .` to install our app globally, this makes the following commands available globally:
    - `artemis run-test` with -tc (task count) and -p (path to test script) required options
      - `artemis run-test -p ~/Desktop/script.js -tc 5`
    - `artemis grafana-start`
    - `artemis grafana-stop`
    - `artemis deploy` (not written yet, needs the deploy.js command)
