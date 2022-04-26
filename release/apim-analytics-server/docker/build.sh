#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

amaxServerDir=$scriptDir/../../../apim-analytics-server
dockerContext=$scriptDir/context

buildFiles=(
  "$amaxServerDir/src"
  "$amaxServerDir/build.ts"
  "$amaxServerDir/package*.json"
  "$amaxServerDir/tsconfig.json"
)

############################################################################################################################
# Helper

function getProperty () {
  cat "${1}" | python3 -c "import json,sys; obj=json.load(sys.stdin); print(obj['${2}']);"
}

############################################################################################################################
# Run

rm -rf "$dockerContext/*"
mkdir -p "$dockerContext"

echo ">>> Create docker build context for API Management Analytics Server ..."
for filePattern in ${buildFiles[@]}; do
  cp -Rf "$filePattern" "$dockerContext"
done
echo ">>> Success"

dockerImageName=$(getProperty "$dockerContext/package.json" name | rev | cut -f 1 -d '/' | rev)
dockerImageTag=$(getProperty "$dockerContext/package.json" version)

echo ">>> Remove docker containers and images for API Management Analytics Server ..."
containers=$(docker ps -a -q --filter "ancestor=$dockerImageName")
for container in ${containers[@]}; do
  docker rm -f $container
  if [[ $? != 0 ]]; then echo ">>> ERROR: docker rm failed"; exit 1; fi
done
docker rmi -f "$dockerImageName:$dockerImageTag" "$dockerImageName:latest"
if [[ $? != 0 ]]; then echo ">>> ERROR: docker rmi failed"; exit 1; fi
echo ">>> Success"

echo ">>> Build docker image for API Management Analytics Server ..."
docker build --progress=plain --no-cache --tag $dockerImageName:$dockerImageTag -f "$scriptDir/Dockerfile" "$dockerContext"
if [[ $? != 0 ]]; then echo ">>> ERROR: docker build failed"; exit 1; fi
docker tag $dockerImageName:$dockerImageTag $dockerImageName:latest
if [[ $? != 0 ]]; then echo ">>> ERROR: docker tag failed"; exit 1; fi
echo ">>> Success"

rm -rf $dockerContext

###
# End
