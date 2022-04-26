#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

envFile="$scriptDir/../../.env"

toolsDir="$scriptDir/../../../tools"
resourcesDir="$scriptDir/.."

dockerProjectName="amax-test"
dockerComposeFile="$scriptDir/docker-compose.yml"

############################################################################################################################
# Run

echo ">>> Delete resources for API Management Connector ..."
node -r ts-node/register "$toolsDir/connector.ts" delete "$resourcesDir/test-organization.json"
if [[ $? != 0 ]]; then echo ">>> ERROR: connector.ts delete failed"; exit 1; fi
echo ">>> Success"

echo ">>> Stop containers for API Management Connector ..."
docker-compose --env-file="$envFile" -p $dockerProjectName -f "$dockerComposeFile" down --volumes
if [[ $? != 0 ]]; then echo ">>> ERROR: docker compose stop failed"; exit 1; fi
echo ">>> Success"

###
# End
