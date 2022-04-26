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
# Helper

function getenv {
  value=${!1}
  if [ -z "$value" ]; then
    grep -s "${1}" "$envFile" | cut -f 2 -d '='
  else
    echo $value
  fi
}

function isServerAvailable {
  curl "${1}" -o /dev/null --silent
}

function waitUntilServerIsAvailable {
  printf "Wait until server is available "
  while ! isServerAvailable "${1}"; do
    printf "."
    sleep 1
  done
  printf "\r\033[2K"
}

############################################################################################################################
# Run

echo ">>> Start containers for API Management Connector ..."
docker-compose --env-file "$envFile" -p $dockerProjectName -f "$dockerComposeFile" up -d
if [[ $? != 0 ]]; then echo ">>> ERROR: docker compose up failed"; exit 1; fi
echo ">>> Success"

waitUntilServerIsAvailable "http://localhost:$(getenv AMAX_SERVER_CONNECTOR_PORT)"

echo ">>> Create resources for API Management Connector ..."
node -r ts-node/register "$toolsDir/connector.ts" create "$resourcesDir/test-organization.json"
if [[ $? != 0 ]]; then echo ">>> ERROR: connector.ts create failed"; exit 1; fi
echo ">>> Success"

###
# End
