#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);

############################################################################################################################
# Settings

rootDir="$scriptDir/.."

export DOTENV_CONFIG_PATH="$rootDir/devel/.env"
export TS_NODE=true
export NODE_OPTIONS="-r ts-node/register"

############################################################################################################################
# Run

if [ "$1" == "--debug" ]; then
  node  --inspect-brk "$rootDir/src/server.ts"
else
  node "$rootDir/src/server.ts"
fi

####
# Done
