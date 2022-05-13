#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);

############################################################################################################################
# Settings

envFile="$scriptDir/../../.env"

############################################################################################################################
# Helper

function getenv {
  result=$(grep "${1}" "$envFile" -s | cut -f 2 -d '=')
  echo ${result:-$2}
}

############################################################################################################################
# Run

printf "Wait until server is available "
until curl "http://localhost:$(getenv AMAX_CONNECTOR_PORT 8082)" -o /dev/null --silent; do
  printf "."
  sleep 1
done
printf "\r\033[2K"

####
# End
