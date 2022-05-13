#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

envFile="$scriptDir/../.env"

dockerProjectName="amax-devel"
dockerComposeFile="$scriptDir/../docker-compose/docker-compose.yml"

############################################################################################################################
# Prepare

# update file-based configuration
"$scriptDir/internal/update.apim-connector.sh"
"$scriptDir/internal/update.prometheus.sh"

############################################################################################################################
# Run

docker-compose -p $dockerProjectName -f "$dockerComposeFile" ps | grep --silent apim-connector
if [[ $? == 0 ]]; then

  echo ">>> Starting API Management Connector ..."
  docker-compose -p $dockerProjectName -f "$dockerComposeFile" --env-file="$envFile" up -d apim-connector
  if [[ $? != 0 ]]; then echo ">>> ERROR: docker compose up failed"; exit 1; fi
  echo ">>> Success"

  "$scriptDir/internal/wait-for-apim-connector.sh"

fi

echo ">>> Starting services for API Management Analytics development ..."
docker-compose -p $dockerProjectName -f "$dockerComposeFile" --env-file="$envFile" up -d mongodb prometheus grafana
if [[ $? != 0 ]]; then echo ">>> ERROR: docker compose up failed"; exit 1; fi
echo ">>> Success"

###
# End
