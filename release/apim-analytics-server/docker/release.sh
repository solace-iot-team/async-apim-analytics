#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

amaxServerDir=$scriptDir/../../../apim-analytics-server

SKIPPING="+++ SKIPPING +++"
dockerHubUser="solaceiotteam"

############################################################################################################################
# Helper

function getProperty () {
  cat "${1}" | python3 -c "import json,sys; obj=json.load(sys.stdin); print(obj['${2}']);"
}

############################################################################################################################
# Run

dockerImageName=$(getProperty "$amaxServerDir/package.json" name | rev | cut -f 1 -d '/' | rev)
dockerImageTag=$(getProperty "$amaxServerDir/package.json" version)

echo ">>> Check if docker image for API Management Analytics Server has been built ..."
docker image inspect $dockerImageName:$dockerImageTag --format "{{.Id}}" 2> /dev/null
if [[ $? != 0 ]]; then echo "ERROR: image not found, must be built first"; exit 1; fi
echo ">>> Done"

echo ">>> Check if docker image for API Management Analytics Server has already been published ..."
docker manifest inspect $dockerHubUser/$dockerImageName:$dockerImageTag 2> /dev/null
if [[ $? == 0 ]]; then echo "[$SKIPPING]: image has already been published"; exit 2; fi
echo ">>> Done"

echo ">>> Publish docker image for API Management Analytics Server ..."
docker tag $dockerImageName:$dockerImageTag $dockerHubUser/$dockerImageName:$dockerImageTag
if [[ $? != 0 ]]; then echo ">>> ERROR: docker tag failed"; exit 1; fi
docker tag $dockerImageName:$dockerImageTag $dockerHubUser/$dockerImageName:latest
if [[ $? != 0 ]]; then echo ">>> ERROR: docker tag failed"; exit 1; fi
docker push $dockerHubUser/$dockerImageName:$dockerImageTag
if [[ $? != 0 ]]; then echo ">>> ERROR: docker push failed"; exit 1; fi
docker push $dockerHubUser/$dockerImageName:latest
if [[ $? != 0 ]]; then echo ">>> ERROR: docker push failed"; exit 1; fi
echo ">>> Success"

###
# End
