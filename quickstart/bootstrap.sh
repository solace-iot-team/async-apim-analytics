#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

envFile=$scriptDir/.env

toolsDir=$scriptDir/../apim-analytics-server/tools
resourcesDir=$scriptDir/resources

dockerProjectName="amax-qs"
dockerComposeFile="$scriptDir/docker-compose.yml"

############################################################################################################################
# Helper

function getenv {
  grep "${1}" "$envFile" | cut -f 2 -d '='
}

function isServerAvailable () {
  curl "${1}" -o /dev/null --silent
}

function waitUntilServerIsAvailable () {
  printf "Wait until server is available "
  while ! isServerAvailable "${1}"; do
    printf "."
    sleep 1
  done
  printf "\r\033[2K"
}

############################################################################################################################
# Run

echo ">>> Create and build containers for API Management Connector and API Management Analytics ..."
docker-compose -p $dockerProjectName -f "$dockerComposeFile" up --no-start
if [[ $? != 0 ]]; then echo ">>> ERROR: docker compose up failed"; exit 1; fi
echo ">>> Success"

echo ">>> Start containers for API Management Connector ..."
docker-compose -p $dockerProjectName -f "$dockerComposeFile" start apim-connector-mongodb apim-connector
if [[ $? != 0 ]]; then echo ">>> ERROR: docker compose start failed"; exit 1; fi
echo ">>> Success"

waitUntilServerIsAvailable "http://localhost:$(getenv AMAX_SERVER_CONNECTOR_PORT)"

echo ">>> Create organizations for API Management Connector ..."
DOTENV_CONFIG_PATH="$envFile" "$toolsDir/connector.ts" create "$resourcesDir/organization1.json"
if [[ $? != 0 ]]; then echo ">>> ERROR: connector.ts create failed"; exit 1; fi
echo ">>> Success"

echo ">>> Start containers for API Management Analytics ..."
docker-compose -p $dockerProjectName -f "$dockerComposeFile" start apim-analytics-server
if [[ $? != 0 ]]; then echo ">>> ERROR: docker compose start failed"; exit 1; fi
echo ">>> Success"

###
# End
