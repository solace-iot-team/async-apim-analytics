#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);

############################################################################################################################
# Settings

envFile="$scriptDir/../../.env"

############################################################################################################################
# Helper

function getenv {
  result=$(grep "${1}" "$envFile" -s | cut -f 2 -d '=')
  echo ${result:-$2}
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
    - targets: ["host.docker.internal:$(getenv AMAX_SERVER_PORT 8080)"]
    metrics_path: "/v1/metrics"
    basic_auth:
      username: "$(getenv AMAX_SERVER_USERNAME)"
      password: "$(getenv AMAX_SERVER_PASSWORD)"
EOF

####
# End
