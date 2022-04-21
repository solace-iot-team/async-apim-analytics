#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

rootDir=${scriptDir}/../..

dockerProjectName="amax-devel"
dockerComposeFile="$scriptDir/docker-compose.yml"

############################################################################################################################
# Helper

function getenv {
  grep "${1}" ${rootDir}/.env | cut -f 2 -d '='
}

function isServerAvailable() {
  curl $(getenv AMAX_SERVER_CONNECTOR_URL) -o /dev/null --silent
}

function waitUntilServerIsAvailable() {
  printf "Wait until server is available "
  while ! isServerAvailable; do
    printf "."
    sleep 1
  done
  printf "\r\033[2K"
}

############################################################################################################################
# Run

echo ">>> Create and build containers for API Management Connector ..."
docker-compose -p $dockerProjectName -f "$dockerComposeFile" up
if [[ $? != 0 ]]; then echo ">>> ERROR: docker compose up failed"; exit 1; fi
echo ">>> Success"

waitUntilServerIsAvailable

echo ">>> Create resources for API Management Connector ..."
DOTENV_CONFIG_PATH=${rootDir}/.env ${rootDir}/tools/connector.ts create ${scriptDir}/resources/organization1.json
if [[ $? != 0 ]]; then echo ">>> ERROR: tools/connector.ts create failed"; exit 1; fi
DOTENV_CONFIG_PATH=${rootDir}/.env ${rootDir}/tools/connector.ts create ${scriptDir}/resources/organization2.json
if [[ $? != 0 ]]; then echo ">>> ERROR: tools/connector.ts create failed"; exit 1; fi
echo ">>> Success"

###
# End
