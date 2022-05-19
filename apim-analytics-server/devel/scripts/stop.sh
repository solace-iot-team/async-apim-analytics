#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

dockerProjectName="amax-devel"
dockerComposeFile="$scriptDir/../docker-compose/docker-compose.yml"

############################################################################################################################
# Preapre

# set environment variables for Docker Compose CLI
export COMPOSE_PROJECT_NAME=$dockerProjectName
export COMPOSE_FILE=$dockerComposeFile

############################################################################################################################
# Run

echo ">>> Stopping services for API Management Analytics development ..."
docker-compose stop
if [[ $? != 0 ]]; then echo ">>> ERROR: docker-compose stop failed"; exit 1; fi
echo ">>> Success"

###
# End
