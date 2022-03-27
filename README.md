# Artemis API Load Testing

### current details

- `package.json` files consolidated to root of `artemis` directory
  - run `npm install` from `artemis` directory
- implemented beginnings of CLI
  - from `artemis` folder run `npm i -g .` to install our app globally, this makes the following commands available globally:
    - `artemis run-test` with `-tc` (task count) and `-p` (path to test script) required options, for example:
      - `artemis run-test -p ~/Desktop/script.js -tc 5`
      - note: options can be in any order, `-tc` before `-p` is fine also
    - `artemis grafana-start`
    - `artemis grafana-stop`
    - `artemis deploy` (not written yet, needs the `deploy.js` command)
