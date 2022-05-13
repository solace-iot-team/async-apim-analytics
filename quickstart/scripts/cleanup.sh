#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

envFile="$scriptDir/../.env"

toolsDir="$scriptDir/../../apim-analytics-tools"
resourcesDir="$scriptDir/../resources"

dockerProjectName="amax-qs"
dockerComposeFile="$scriptDir/../docker-compose/docker-compose.yml"

############################################################################################################################
# Prepare

# update file-based configuration
"$scriptDir/internal/update.apim-connector.sh"

############################################################################################################################
# Run

docker-compose -p $dockerProjectName -f "$dockerComposeFile" ps | grep --silent apim-connector
if [[ $? == 0 ]]; then

  echo ">>> Starting API Management Connector ..."
  docker-compose -p $dockerProjectName -f "$dockerComposeFile" --env-file="$envFile" up -d apim-connector
  if [[ $? != 0 ]]; then echo ">>> ERROR: docker compose up failed"; exit 1; fi
  echo ">>> Success"

  "$scriptDir/internal/wait-for-apim-connector.sh"

  echo ">>> Cleaning up API Management Connector ..."
  DOTENV_CONFIG_PATH="$envFile" npm --silent --prefix "$toolsDir" run configure-connector delete "$resourcesDir/apim-connector/organization1.json"
  if [[ $? != 0 ]]; then echo ">>> ERROR: configure-connector delete failed"; exit 1; fi
  echo ">>> Success"

fi

echo ">>> Deleting services for API Management Analytics quickstart ..."
docker-compose -p $dockerProjectName -f "$dockerComposeFile" --env-file="$envFile" down --volumes
if [[ $? != 0 ]]; then echo ">>> ERROR: docker compose down failed"; exit 1; fi
echo ">>> Success"

###
# End
