#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Set environment variables

logsDir="$scriptDir/../../tmp/logs/$(node --version)"
scriptLogFile="$logsDir/npm.run.test-integration.log"

export AMAX_SERVER_PORT=8081
export AMAX_SERVER_LOGGER_LOG_LEVEL=debug
export AMAX_SERVER_LOGGER_LOG_FILE="$logsDir/server.test-integration.log"

export AMAX_SERVER_CONNECTOR_PORT=8080
export AMAX_SERVER_CONNECTOR_USERNAME=admin
export AMAX_SERVER_CONNECTOR_PASSWORD=Solace123!

export AMAX_SERVER_ORGANIZATIONS=test-organization

############################################################################################################################
# Prepare

mkdir -p $logsDir
rm -rf $logsDir/*

FAILED=0

############################################################################################################################
# Run

runScript="npm run test:integration"
echo "Starting: $runScript ..."
$runScript > $scriptLogFile 2>&1
code=$?; if [[ $code != 0 ]]; then echo ">>> ERROR - code=$code - runScript='$runScript' - $scriptName"; FAILED=1; fi

############################################################################################################################
# Check result

if [[ "$FAILED" -eq 0 ]]; then
  echo ">>> FINISHED:SUCCESS - $scriptName"
  touch "$logsDir/$scriptName.SUCCESS.out"
else
  echo ">>> FINISHED:FAILED";
  echo "Scanning logs for errors & failed tests ..."
  filePattern="$scriptLogFile"
  IFS=$'\n' typescript_errors=($(grep -n -r -e "TSError:" $filePattern))
  IFS=$'\n' runtime_errors=($(grep -n -r -e "ERROR " $filePattern))
  IFS=$'\n' failed_tests=($(grep -n -r -e "failing" $filePattern))
  if [ ! -z "$typescript_errors" ]; then
    echo " .. found ${#typescript_errors[@]} typescript errors"
    for item in ${typescript_errors[*]}
    do
      echo $item >> "$logsDir/$scriptName.ERROR.out"
    done
  else
    echo " .. no typescript errors found"
  fi
  if [ ! -z "$runtime_errors" ]; then
    echo " .. found ${#runtime_errors[@]} runtime errors"
    for item in ${runtime_errors[*]}
    do
      echo $item >> "$logsDir/$scriptName.ERROR.out"
    done
  else
    echo " .. no runtime errors found"
  fi
  if [ ! -z "$failed_tests" ]; then
    echo " .. found ${#failed_tests[@]} failed tests"
    for item in ${failed_tests[*]}
    do
      echo $item >> "$logsDir/$scriptName.ERROR.out"
    done
  else
    echo " .. no failed tests found"
  fi
  exit 1
fi

###
# Done
