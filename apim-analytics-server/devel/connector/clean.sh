#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

dockerProjectName="amax-devel"
dockerComposeFile="$scriptDir/docker-compose.yml"

############################################################################################################################
# Run

echo ">>> Remove containers, networks and volumes for API Management Connector ..."
docker-compose -p $dockerProjectName -f "$dockerComposeFile" down --volumes
if [[ $? != 0 ]]; then echo ">>> ERROR: docker-compose down failed"; exit 1; fi
docker-compose -p $dockerProjectName -f "$dockerComposeFile" ps -a
echo ">>> Success"

###
# End
