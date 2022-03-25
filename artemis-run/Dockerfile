FROM --platform=linux/amd64 node:17-alpine

# install K6
WORKDIR /tmp
ADD https://github.com/grafana/k6/releases/download/v0.37.0/k6-v0.37.0-linux-amd64.tar.gz /tmp/k6-v0.37.0-linux-amd64.tar.gz
RUN tar -xzf k6-v0.37.0-linux-amd64.tar.gz
RUN mv k6-v0.37.0-linux-amd64/k6 /usr/bin/k6

# install NPM dependencies
COPY . /test
WORKDIR /test
RUN npm ci

CMD [ "node", "run_k6_test.js" ]