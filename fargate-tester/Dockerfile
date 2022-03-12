FROM --platform=linux/amd64 node:lts-gallium

RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
RUN echo "deb https://dl.k6.io/deb stable main" | tee /etc/apt/sources.list.d/k6.list
RUN apt-get update
RUN apt-get install k6

COPY ./app /test

WORKDIR /test

RUN npm install

CMD [ "node", "run-k6-test.js" ]
