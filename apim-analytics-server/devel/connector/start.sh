#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

dockerProjectName="amax-devel"
dockerComposeFile="$scriptDir/docker-compose.yml"

############################################################################################################################
# Run

echo ">>> Build, create and start containers for API Management connector ..."
docker-compose -p $dockerProjectName -f "$dockerComposeFile" up -d
if [[ $? != 0 ]]; then echo ">>> ERROR: docker-compose up failed"; exit 1; fi
docker-compose -p $dockerProjectName -f "$dockerComposeFile" ps -a
echo ">>> Success"

###
# End
