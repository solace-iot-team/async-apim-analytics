#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

rootDir=${scriptDir}/../..

dockerProjectName="amax-devel"
dockerComposeFile="$scriptDir/docker-compose.yml"

############################################################################################################################
# Run

echo ">>> Start containers for API Management connector ..."
docker-compose -p $dockerProjectName -f "$dockerComposeFile" start
if [[ $? != 0 ]]; then echo ">>> ERROR: docker-compose start failed"; exit 1; fi
docker-compose -p $dockerProjectName -f "$dockerComposeFile" ps -a
echo ">>> Success"

echo ">>> Delete organizations for API Management Connector ..."
DOTENV_CONFIG_PATH=${rootDir}/.env ${rootDir}/tools/connector.ts delete ${scriptDir}/resources/organization1.json
if [[ $? != 0 ]]; then echo ">>> ERROR: tools/connector.ts delete failed"; exit 1; fi
DOTENV_CONFIG_PATH=${rootDir}/.env ${rootDir}/tools/connector.ts delete ${scriptDir}/resources/organization2.json
if [[ $? != 0 ]]; then echo ">>> ERROR: tools/connector.ts delete failed"; exit 1; fi
echo ">>> Success"

echo ">>> Remove containers, networks and volumes for API Management Connector ..."
docker-compose -p $dockerProjectName -f "$dockerComposeFile" down --volumes
if [[ $? != 0 ]]; then echo ">>> ERROR: docker-compose down failed"; exit 1; fi
docker-compose -p $dockerProjectName -f "$dockerComposeFile" ps -a
echo ">>> Success"

###
# End
