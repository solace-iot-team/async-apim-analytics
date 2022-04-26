#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);

############################################################################################################################
# Settings

rootDir="$scriptDir/.."
export DOTENV_CONFIG_PATH="$rootDir/test/.env"

############################################################################################################################
# Run

case $1 in
  "integration")
     mocha --config "$rootDir/test/integration/.mocharc.yml" "$rootDir/test/integration/integration.spec.ts"
     ;;
esac

####
# Done
