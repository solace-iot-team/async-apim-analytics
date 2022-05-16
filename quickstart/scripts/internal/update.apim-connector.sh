#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);

############################################################################################################################
# Prepare

export $(grep -v '^#' "$scriptDir/../../.env" | xargs -0)

############################################################################################################################
# Run

cat <<EOF > "$scriptDir/../../docker-compose/docker-volumes/apim-connector/user-registry.json"
{
  "$AMAX_CONNECTOR_USERNAME": {
    "password": "$AMAX_CONNECTOR_PASSWORD",
    "roles": ["platform-admin","org-admin"]
  }
}
EOF

####
# End
