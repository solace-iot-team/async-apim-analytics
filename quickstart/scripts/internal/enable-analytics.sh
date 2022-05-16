#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);

############################################################################################################################
# Prepare

export $(grep -v '^#' "$scriptDir/../../.env" | xargs -0)

############################################################################################################################
# Run

for organization in $(echo $AMAX_ORGANIZATIONS | tr ',' '\n')
do
  curl -X POST -u $AMAX_SERVER_USERNAME:$AMAX_SERVER_PASSWORD http://localhost:${AMAX_SERVER_PORT:-8088}/v1/organizations -d '''
  {
    "name": "$organization",
    "enabled": true
  }
  '''
done

####
# End
