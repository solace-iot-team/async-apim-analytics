import fs from 'fs';
import path from 'path';
import * as utils from './lib/utils';
import * as connector from './lib/connector-api';

/**
 * Creates resources for an API Management Connector.
 * 
 * @param filename The name of the resource definition file.
 */
const createResources = async (filename: string): Promise<void> => {

  const resourceSet = utils.createResourceSetFromFile(filename);

  // use the parent directory of the resource definition file as working
  // directory to support relative file names in API resources

  const workingDirectory = path.dirname(filename);
  process.chdir(workingDirectory);

  await connector.createOrganization(resourceSet);
  await connector.createEnvironments(resourceSet);
  await connector.createApis(resourceSet);
  await connector.createApiProducts(resourceSet);
  await connector.createApplications(resourceSet);
}

/**
 * Deletes resources from an API Management Connector.
 * 
 * @param filename The name of the resource definition file.
 */
const deleteResources = async (filename: string): Promise<void> => {

  const resourceSet = utils.createResourceSetFromFile(filename);
  await connector.deleteOrganization(resourceSet);
}

// MAIN

/** Usage information */
const printUsage = () => {
  console.log('Usage: connector-tools [command]');
  console.log('');
  console.log('Commands:');
  console.log('  create <file>      Create API Management connector resources based on a resource definition file');
  console.log('  delete <file>      Delete API Management connector resources based on a resource definition file');
}

/** Filename check */
const checkFilename = (filename: string | undefined): string => {

  if (filename === undefined) {
    printUsage();
    process.exit(1);
  }
  if (!fs.existsSync(filename)) {
    console.log(`ERROR: file '${filename}' was not found`);
    process.exit(1);
  }

  return filename;
}

const args = process.argv;
if (args.length < 3) {
  printUsage();
  process.exit(1);
}

(async () => {

  const command = args[2].toLowerCase();
  try {

    switch (command) {
      case 'create':
        await createResources(checkFilename(args[3]));
        break;
      case 'delete':
        await deleteResources(checkFilename(args[3]));
        break;
      default:
        console.log(`ERROR: command '${command}' is unknown`)
        process.exit(1);
    }

  } catch (all) {
    process.exit(2);
  }

})();
