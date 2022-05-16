#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);

############################################################################################################################
# Prepare

export $(grep -v '^#' "$scriptDir/../../.env" | xargs -0)

############################################################################################################################
# Run

printf "Wait until API Management Connector is available "
until curl http://localhost:${AMAX_SERVER_CONNECTOR_PORT:-8082} -o /dev/null --silent; do
  printf "."
  sleep 1
done
printf "\r\033[2K"

####
# End
