#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

rootDir=${scriptDir}/../..

############################################################################################################################
# Run

echo ">>> Create organizations for the API Management Connector ..."
DOTENV_CONFIG_PATH=${rootDir}/.env ${rootDir}/tools/connector.ts create ${scriptDir}/resources/organization1.json
DOTENV_CONFIG_PATH=${rootDir}/.env ${rootDir}/tools/connector.ts create ${scriptDir}/resources/organization2.json

###
# End
