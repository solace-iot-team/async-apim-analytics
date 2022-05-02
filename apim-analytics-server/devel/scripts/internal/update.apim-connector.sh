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

cat <<EOF > "$scriptDir/../../docker-compose/docker-volumes/apim-connector/user-registry.json"
{
  "$(getenv AMAX_SERVER_CONNECTOR_USERNAME)": {
    "password": "$(getenv AMAX_SERVER_CONNECTOR_PASSWORD)",
    "roles": ["platform-admin","org-admin"]
  }
}
EOF

####
# End
