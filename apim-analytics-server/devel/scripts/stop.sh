#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

dockerProjectName="amax-devel"

############################################################################################################################
# Run

echo ">>> Stopping services for API Management Analytics development ..."
docker-compose -p $dockerProjectName stop
if [[ $? != 0 ]]; then echo ">>> ERROR: docker compose stop failed"; exit 1; fi
echo ">>> Success"

###
# End
