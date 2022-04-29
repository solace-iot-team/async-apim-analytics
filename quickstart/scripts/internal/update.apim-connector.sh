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

cat <<EOF > "$scriptDir/../../docker-compose/docker-volumes/apim-connector/user-registry.json"
{
  "$(getenv AMAX_CONNECTOR_USERNAME)": {
    "password": "$(getenv AMAX_CONNECTOR_PASSWORD)",
    "roles": ["platform-admin","org-admin"]
  }
}
EOF

####
# End
