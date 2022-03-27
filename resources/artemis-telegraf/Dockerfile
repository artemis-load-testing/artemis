FROM --platform=linux/amd64 telegraf:latest

COPY . /artemis-telegraf

EXPOSE 8186

CMD ["telegraf", "--config", "artemis-telegraf/telegraf.conf"]