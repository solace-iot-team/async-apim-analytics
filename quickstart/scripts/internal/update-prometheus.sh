#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);

############################################################################################################################
# Prepare

export $(grep -v '^#' "$scriptDir/../../.env" | xargs -0)

############################################################################################################################
# Run

cat <<EOF > "$scriptDir/../../docker-compose/docker-volumes/prometheus/prometheus.yml"
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: "prometheus"
    scrape_interval: 5s
    static_configs:
    - targets: ["localhost:9090"]
  - job_name: "apim-analytics"
    static_configs:
    - targets: ["apim-analytics:3000"]
    metrics_path: "/v1/metrics"
    basic_auth:
      username: "$AMAX_SERVER_USERNAME"
      password: "$AMAX_SERVER_PASSWORD"
EOF

####
# End
