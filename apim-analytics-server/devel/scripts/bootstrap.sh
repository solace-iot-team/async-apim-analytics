#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

envFile="$scriptDir/../.env"

toolsDir="$scriptDir/../../../apim-analytics-tools"
resourcesDir="$scriptDir/../resources"

dockerProjectName="amax-devel"
dockerComposeFile="$scriptDir/../docker-compose/docker-compose.yml"

dockerProfile=${1:-standard}
if [ "$dockerProfile" != "prometheus-grafana" ] && [ "$dockerProfile" != "standard" ]; then
  echo ">>> ERROR: invalid profile '$dockerProfile'"
  exit 1
fi

############################################################################################################################
# Prepare

# update file-based configuration
"$scriptDir/internal/update-apim-connector.sh"
"$scriptDir/internal/update-prometheus.sh"

# set environment variables for Docker Compose CLI
export COMPOSE_PROJECT_NAME=$dockerProjectName
export COMPOSE_FILE=$dockerComposeFile
export COMPOSE_PROFILES=$dockerProfile

# set environment variables for analytics tools
export DOTENV_CONFIG_PATH=$envFile

############################################################################################################################
# Run

echo ">>> Update images for API Management Analytics ..."
docker-compose --env-file="$envFile" pull
if [[ $? != 0 ]]; then echo ">>> ERROR: docker-compose pull failed"; exit 1; fi
echo ">>> Success"

echo ">>> Creating services for API Management Analytics ..."
docker-compose --env-file="$envFile" up --no-start
if [[ $? != 0 ]]; then echo ">>> ERROR: docker-compose up failed"; exit 1; fi
echo ">>> Success"

if [ "$dockerProfile" == "standard" ]; then

  echo ">>> Starting API Management Connector ..."
  docker-compose --env-file="$envFile" up -d apim-connector
  if [[ $? != 0 ]]; then echo ">>> ERROR: docker-compose up failed"; exit 1; fi
  echo ">>> Success"

  "$scriptDir/internal/wait-for-apim-connector.sh"

  echo ">>> Configuring API Management Connector ..."
  npm --silent --prefix "$toolsDir" run configure-connector create "$resourcesDir/apim-connector/organization1.json"
  if [[ $? != 0 ]]; then echo ">>> ERROR: configure-connector create failed"; exit 1; fi
  npm --silent --prefix "$toolsDir" run configure-connector create "$resourcesDir/apim-connector/organization2.json"
  if [[ $? != 0 ]]; then echo ">>> ERROR: configure-connector create failed"; exit 1; fi
  echo ">>> Success"

fi

echo ">>> Starting services for API Management Analytics development ..."
docker-compose --env-file="$envFile" up -d mongodb prometheus grafana
if [[ $? != 0 ]]; then echo ">>> ERROR: docker-compose up failed"; exit 1; fi
echo ">>> Success"

###
# End
