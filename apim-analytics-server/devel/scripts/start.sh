#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

envFile="$scriptDir/../.env"

toolsDir="$scriptDir/../../tools"
resourcesDir="$scriptDir/../resources"

dockerProjectName="amax-devel"
dockerComposeFile="$scriptDir/../docker-compose/docker-compose.yml"

############################################################################################################################
# Prepare

# update file-based configuration
"$scriptDir/internal/update.apim-connector.sh"
"$scriptDir/internal/update.prometheus.sh"

############################################################################################################################
# Run

docker-compose -p $dockerProjectName ps | grep apim-connector
if [[ $? == 0 ]]; then

  echo ">>> Starting API Management Connector ..."
  docker-compose -p $dockerProjectName -f "$dockerComposeFile" --env-file="$envFile" up -d --wait apim-connector
  if [[ $? != 0 ]]; then echo ">>> ERROR: docker compose up failed"; exit 1; fi
  echo ">>> Success"

fi

echo ">>> Starting services for API Management Analytics development ..."
docker-compose -p $dockerProjectName -f "$dockerComposeFile" --env-file="$envFile" up -d --wait prometheus grafana
if [[ $? != 0 ]]; then echo ">>> ERROR: docker compose up failed"; exit 1; fi
echo ">>> Success"

###
# End
