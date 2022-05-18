#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Settings

apiSpecFile="$scriptDir/../../src/common/api.yml"
outputDir="$scriptDir/../lib/generated/openapi"

############################################################################################################################
# Run

echo ">>> Generating OpenAPI client ..."
npx openapi --input $apiSpecFile --output $outputDir --client node --useOptions --exposeHeadersAndBody
if [[ $? != 0 ]]; then echo ">>> ERROR: failed to generate OpenAPI client"; exit 1; fi
echo ">>> Success"

###
# Done
