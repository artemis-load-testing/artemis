FROM --platform=linux/amd64 node:17-alpine

# install K6
WORKDIR /tmp
ADD https://github.com/grafana/k6/releases/download/v0.37.0/k6-v0.37.0-linux-amd64.tar.gz /tmp/k6-v0.37.0-linux-amd64.tar.gz
RUN tar -xzf k6-v0.37.0-linux-amd64.tar.gz
RUN mv k6-v0.37.0-linux-amd64/k6 /usr/bin/k6
# COPY ./k6.tar.gz /tmp/k6.tar.gz
# RUN tar -xzf k6.tar.gz
# RUN mv k6 /usr/bin/k6

# install NPM dependencies
COPY . /artemis
WORKDIR /artemis
RUN npm ci

# ENV K6_PROMETHEUS_REMOTE_URL https://aps-workspaces.us-east-2.amazonaws.com/workspaces/ws-4e142db2-d818-424b-afda-e4897b1d813b/api/v1/remote_write
# CMD ["sh", "-c", "k6 run script.js -o output-prometheus-remote"]

CMD ["node", "index.js"]