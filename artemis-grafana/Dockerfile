FROM --platform=linux/amd64 grafana/grafana:8.4.4

# Add plugins
ENV GF_INSTALL_PLUGINS=grafana-timestream-datasource

# Provisioning
COPY ./datasources/default.yaml /etc/grafana/provisioning/datasources
COPY ./dashboards/default.yaml /etc/grafana/provisioning/dashboards

COPY ./dashboards/Artemis-default-dashboard.json /var/lib/grafana/dashboards/

COPY ./grafana.ini /etc/grafana

EXPOSE 3000
