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

dockerProfile=${1:-standard}
if [ "$dockerProfile" != "all-in-one" ] && [ "$dockerProfile" != "standard" ]; then
  echo ">>> ERROR: invalid profile '$dockerProfile'"
  exit 1
fi

standardServices="apim-analytics-server prometheus grafana"

############################################################################################################################
# Prepare

# update file-based configuration
"$scriptDir/internal/update.apim-connector.sh"
"$scriptDir/internal/update.prometheus.sh"

############################################################################################################################
# Run

echo ">>> Creating services for API Management Analytics ..."
docker-compose -p $dockerProjectName -f "$dockerComposeFile" --env-file="$envFile" --profile $dockerProfile up --no-start
if [[ $? != 0 ]]; then echo ">>> ERROR: docker compose up failed"; exit 1; fi
echo ">>> Success"

if [ "$dockerProfile" == "all-in-one" ]; then

  echo ">>> Starting API Management Connector ..."
  docker-compose -p $dockerProjectName -f "$dockerComposeFile" --env-file="$envFile" --profile $dockerProfile up -d --wait apim-connector
  if [[ $? != 0 ]]; then echo ">>> ERROR: docker compose up failed"; exit 1; fi
  echo ">>> Success"

  echo ">>> Configuring API Management Connector ..."
  DOTENV_CONFIG_PATH="$envFile" "$toolsDir/connector.ts" create "$resourcesDir/organization1.json"
  if [[ $? != 0 ]]; then echo ">>> ERROR: connector.ts create-resources failed"; exit 1; fi
  echo ">>> Success"

fi

echo ">>> Starting standard services for API Management Analytics ..."
docker-compose -p $dockerProjectName -f "$dockerComposeFile" --env-file="$envFile" --profile $dockerProfile up -d --wait $standardServices
if [[ $? != 0 ]]; then echo ">>> ERROR: docker compose start failed"; exit 1; fi
echo ">>> Success"

###
# End
