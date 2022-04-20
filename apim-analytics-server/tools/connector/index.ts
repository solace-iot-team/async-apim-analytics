import path from 'path';
import * as utils from './lib/utils';
import * as connector from './lib/connector-api';

/**
 * Creates resources for an API Management Connector.
 * 
 * @param filename The name of the resource definition file.
 */
export async function createResources(filename: string): Promise<void> {

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
export async function deleteResources(filename: string) {

  const resourceSet = utils.createResourceSetFromFile(filename);
  await connector.deleteOrganization(resourceSet);
}
