#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

rootDir=${scriptDir}/../..

############################################################################################################################
# Run

echo ">>> Create organizations for API Management Connector ..."
DOTENV_CONFIG_PATH=${rootDir}/.env ${rootDir}/tools/connector.ts create ${scriptDir}/resources/organization1.json
if [[ $? != 0 ]]; then echo ">>> ERROR: tools/connector.ts create failed"; exit 1; fi
DOTENV_CONFIG_PATH=${rootDir}/.env ${rootDir}/tools/connector.ts create ${scriptDir}/resources/organization2.json
if [[ $? != 0 ]]; then echo ">>> ERROR: tools/connector.ts create failed"; exit 1; fi
echo ">>> Success"

###
# End
