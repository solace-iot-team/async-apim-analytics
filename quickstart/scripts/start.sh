#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

envFile="$scriptDir/../.env"

toolsDir="$scriptDir/../../apim-analytics-server/tools"
resourcesDir="$scriptDir/../resources"

dockerProjectName="amax-qs"
dockerComposeFile="$scriptDir/../docker-compose/docker-compose.yml"

############################################################################################################################
# Prepare

# update file-based configuration
"$scriptDir/internal/update-apim-connector.sh"
"$scriptDir/internal/update-prometheus.sh"

# set environment variables for Docker Compose CLI
export COMPOSE_PROJECT_NAME=$dockerProjectName
export COMPOSE_FILE=$dockerComposeFile

# set environment variables for analytics tools
export DOTENV_CONFIG_PATH=$envFile

############################################################################################################################
# Run

docker-compose ps | grep --silent apim-connector
if [[ $? == 0 ]]; then

  echo ">>> Starting API Management Connector ..."
  docker-compose --env-file="$envFile" up -d apim-connector
  if [[ $? != 0 ]]; then echo ">>> ERROR: docker-compose up failed"; exit 1; fi
  echo ">>> Success"

  "$scriptDir/internal/wait-for-apim-connector.sh"

fi

echo ">>> Starting services for API Management Analytics quickstart ..."
docker-compose --env-file="$envFile" up -d apim-analytics prometheus grafana
if [[ $? != 0 ]]; then echo ">>> ERROR: docker-compose up failed"; exit 1; fi
echo ">>> Success"

"$scriptDir/internal/wait-for-analytics-server.sh"

###
# End
