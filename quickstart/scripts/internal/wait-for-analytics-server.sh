#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);

############################################################################################################################
# Prepare

export $(grep -v '^#' "$scriptDir/../../.env" | xargs -0)

############################################################################################################################
# Run

printf "Wait until API Management Analytics server is available "
until curl http://localhost:${AMAX_SERVER_PORT:-8088}/health -o /dev/null --silent; do
  printf "."
  sleep 1
done
printf "\r\033[2K"

####
# End
