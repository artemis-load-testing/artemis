FROM --platform=linux/amd64 grafana/grafana:8.4.4

# Add plugins
ENV GF_INSTALL_PLUGINS=grafana-timestream-datasource

# Provisioning
COPY ./default.yaml /etc/grafana/provisioning/datasources

EXPOSE 3000

# CMD []
# ENTRYPOINT []