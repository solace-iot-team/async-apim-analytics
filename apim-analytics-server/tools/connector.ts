#!/usr/bin/env ts-node

import fs from 'fs';
import * as connector from './connector/index';

const printUsage = () => {
  console.log('Usage: connector.ts [command]');
  console.log('');
  console.log('Commands:');
  console.log('  create <file>      Create API Management connector resources based on a resource definition file');
  console.log('  delete <file>      Delete API Management connector resources based on a resource definition file');
}

const args = process.argv;
if (args.length < 3) {
  printUsage();
  process.exit(1);
}

const command = args[2];
if (command !== 'create' && command !== 'delete') {
  console.log(`ERROR: command '${command}' is unknown.`)
  process.exit(1);
}

const checkFilename = (filename: string | undefined): string => {

  if (filename === undefined) {
    printUsage();
    process.exit(1);
  }
  if (!fs.existsSync(filename)) {
    console.log(`ERROR: file '${filename}' was not found.`);
    process.exit(1);
  }

  return filename;
}

const createResources = async (filename: string): Promise<void> => {
  try {
    await connector.createResources(filename);
  } catch (all) {
    process.exit(2);
  }
}

const deleteResources = async (filename: string): Promise<void> => {
  try {
    await connector.deleteResources(filename);
  } catch (all) {
    process.exit(2);
  }
}

(async () => {

  switch (command) {
    case 'create':
      await createResources(checkFilename(args[3]));
      break;
    case 'delete':
      await deleteResources(checkFilename(args[3]));
      break;
  }

})();
