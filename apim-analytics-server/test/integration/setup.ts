import path from 'path';
import s from 'shelljs';
import fetch from 'node-fetch';
import request from 'supertest';
import server from '../../dist/server';
import { Constants } from '../lib/constants';
import * as utils from '../lib/utils';
import {
  AdministrationService,
  Organization
} from '../lib/connector-api';

const scriptName: string = path.basename(__filename);
const scriptDir: string = path.dirname(__filename);

const resourcesDirectory = `${scriptDir}/../resources`;
const connectorServerDirectory = `${resourcesDirectory}/apim-connector`;

const dockerProjectName = 'amax-test';
const dockerCompositeFile = `${connectorServerDirectory}/docker-compose.yml`

const solaceCloudToken = utils.getMandatoryEnvVarAsString('AMAX_SOLACE_CLOUD_TOKEN');

/**
 * Wait until the API Management Connector is up and running.
 */
const waitUntilConnectorIsAvailable = async (): Promise<void> => {

  const serverPort = utils.getEnvVarAsNumber('AMAX_SERVER_CONNECTOR_PORT', Constants.DEFAULT_CONNECTOR_PORT);

  const checkServer = async (): Promise<boolean> => {
    return fetch(`http://localhost:${serverPort}`).then((response) => {
      return (response.status == 200);
    }, () => { return false; });
  }

  return new Promise(async (resolve, reject) => {
    setTimeout(() => reject('failed to connect to server within 60 seconds'), 60000);
    while (!(await checkServer())) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    resolve();
  });
}

/**
 * Setup the API Management Connector.
 * 
 * This function creates the test organizations in the API Management Connector.
 */
const setupConnector = async (): Promise<void> => {

  const organization1: Organization = {
    name: Constants.TEST_ORGANIZATION_1,
    'cloud-token': solaceCloudToken,
  };

  const organization2: Organization = {
    name: Constants.TEST_ORGANIZATION_2,
    'cloud-token': solaceCloudToken,
  };

  await Promise.all([
    AdministrationService.createOrganization({ requestBody: organization1 }),
    AdministrationService.createOrganization({ requestBody: organization2 }),
  ]);
}

/**
 * Teardown the API Management Connector.
 * 
 * This function deletes all resources from the API Management Connector.
 */
const teardownConnector = async (): Promise<void> => {

  await Promise.all([
    AdministrationService.deleteOrganization({ organizationName: Constants.TEST_ORGANIZATION_1 }),
    AdministrationService.deleteOrganization({ organizationName: Constants.TEST_ORGANIZATION_2 }),
  ]);
}

export async function mochaGlobalSetup() {

  utils.logMessage(scriptName, 'Setup test environment ...');

  utils.logMessage(scriptName, 'Create docker containers for API Management Connector ...');
  if (s.exec(`docker-compose -p ${dockerProjectName} -f "${dockerCompositeFile}" up -d`).code != 0) {
    utils.logMessage(scriptName, 'ERROR: failed to create docker containers');
    process.exit(1);
  }
  utils.logMessage(scriptName, 'Docker containers for API Management Connector created');

  utils.logMessage(scriptName, 'Wait until API Management Connector is up and running ...');
  await waitUntilConnectorIsAvailable().catch(() => {
    utils.logMessage(scriptName, 'ERROR: connector is not available');
    process.exit(1);
  });
  utils.logMessage(scriptName, 'API Management Connector is up and running');

  utils.logMessage(scriptName, 'Setup the API Management Connector ...');
  await setupConnector().catch(() => {
    utils.logMessage(scriptName, 'ERROR: failed to setup connector');
    process.exit(1);
  });
  utils.logMessage(scriptName, 'API Management Connector was setup');

  utils.logMessage(scriptName, 'Start API Management Analytics Server ...');
  await request(server).get('/').expect(200).catch(() => {
    utils.logMessage(scriptName, 'ERROR: failed to start analytics server');
    process.exit(1);
  });
  utils.logMessage(scriptName, 'API Management Analytics Server started');

  utils.logMessage(scriptName, 'Setup finished');
}

export async function mochaGlobalTeardown() {

  utils.logMessage(scriptName, 'Teardown test environment ...');

  utils.logMessage(scriptName, 'Teardown the API Management Connector ...');
  await teardownConnector().catch(() => {
    utils.logMessage(scriptName, 'ERROR: failed to teardown connector');
    process.exit(1);
  });
  utils.logMessage(scriptName, 'API Management Connector was setup');

  utils.logMessage(scriptName, 'Delete docker containers for API Management Connector ...');
  if (s.exec(`docker-compose -p ${dockerProjectName} -f "${dockerCompositeFile}" down --volumes`).code != 0) {
    utils.logMessage(scriptName, 'ERROR: failed to delete docker containers');
    process.exit(1);
  }
  utils.logMessage(scriptName, 'Docker containers for API Management Connector deleted');

  utils.logMessage(scriptName, 'Teardown finished');
}
