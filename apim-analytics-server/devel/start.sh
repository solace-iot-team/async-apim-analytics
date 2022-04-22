#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

dockerProjectName="amax-devel"
dockerComposeFile="$scriptDir/docker-compose.yml"

############################################################################################################################
# Run

echo ">>> Start containers for API Management Connector ..."
docker-compose -p $dockerProjectName -f "$dockerComposeFile" start
if [[ $? != 0 ]]; then echo ">>> ERROR: docker compose start failed"; exit 1; fi
echo ">>> Success"

###
# End
