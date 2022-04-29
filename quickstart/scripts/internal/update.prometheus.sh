#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);

############################################################################################################################
# Settings

envFile="$scriptDir/../../.env"

############################################################################################################################
# Helper

function getenv {
  grep "${1}" "$envFile" | cut -f 2 -d '='
}

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
  - job_name: "apim-analytics-server"
    static_configs:
    - targets: ["apim-analytics-server:3000"]
    metrics_path: "/v1/metrics"
    basic_auth:
      username: "$(getenv AMAX_SERVER_USERNAME)"
      password: "$(getenv AMAX_SERVER_PASSWORD)"
EOF

####
# End
