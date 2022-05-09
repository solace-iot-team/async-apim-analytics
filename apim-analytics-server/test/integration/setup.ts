import path from 'path';
import s from 'shelljs';
import fetch from 'node-fetch';
import request from 'supertest';
import server from '../../dist/server';
import { logger } from '../lib/test-helper';

const scriptName: string = path.basename(__filename);
const scriptDir: string = path.dirname(__filename);

const resourcesDirectory = `${scriptDir}/../resources`;
const connectorServerDirectory = `${resourcesDirectory}/apim-connector`;

const dockerProjectName = 'amax-test';
const dockerCompositeFile = `${connectorServerDirectory}/docker-compose.yml`

const waitUntilConnectorIsAvailable = async (): Promise<void> => {

  const serverPort = process.env.AMAX_SERVER_CONNECTOR_PORT ?? '8080';

  const checkServer = async (): Promise<boolean> => {
    return fetch(`http://localhost:${serverPort}`).then((response) => {
      return (response.status == 200);
    }, () => { return false; });
  }

  return new Promise(async (resolve) => {
    while (!(await checkServer())) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    resolve();
  });
}

export async function mochaGlobalSetup() {

  logger.log(scriptName, 'Setup test environment ...');

  // NOTE: github uses an older version of Docker Compose which doesn't support the '--wait'
  //       parameter for the 'up' command.

  logger.log(scriptName, 'Create docker containers for API Management Connector ...');
  if (s.exec(`docker-compose -p ${dockerProjectName} -f "${dockerCompositeFile}" up -d`).code != 0) {
    logger.log(scriptName, 'ERROR: failed to create docker containers');
    process.exit(1);
  }
  logger.log(scriptName, 'Docker containers for API Management Connector created');

  logger.log(scriptName, 'Wait until API Management Connector is up and running ...');
  await waitUntilConnectorIsAvailable().catch(() => {
    logger.log(scriptName, 'ERROR: connector is not available');
    process.exit(1);
  });
  logger.log(scriptName, 'API Management Connector is up and running');

  // logger.log(scriptName, 'Create resources for API Management Connector ...');
  // await tools.createResources(`${resourcesDirectory}/test-organization.json`).catch(() => {
  //   logger.log(scriptName, 'ERROR: failed to create resources');
  //   process.exit(1);
  // });
  // logger.log(scriptName, 'Resources for API Management Connector created');

  logger.log(scriptName, 'Start API Management Analytics Server ...');
  await request(server).get('/').expect(200).catch(() => {
    logger.log(scriptName, 'ERROR: failed to start analytics server');
    process.exit(1);
  });
  logger.log(scriptName, 'API Management Analytics Server started');

  logger.log(scriptName, 'Setup finished');
}

export async function mochaGlobalTeardown() {

  logger.log(scriptName, 'Teardown test environment ...');

  // logger.log(scriptName, 'Delete resources for API Management Connector ...');
  // await tools.deleteResources(`${resourcesDirectory}/test-organization.json`).catch(() => {
  //   logger.log(scriptName, 'ERROR: failed to delete resources');
  //   process.exit(1);
  // });
  // logger.log(scriptName, 'Resources for API Management Connector deleted');

  logger.log(scriptName, 'Delete docker containers for API Management Connector ...');
  if (s.exec(`docker-compose -p ${dockerProjectName} -f "${dockerCompositeFile}" down --volumes`).code != 0) {
    logger.log(scriptName, 'ERROR: failed to delete docker containers');
    process.exit(1);
  }
  logger.log(scriptName, 'Docker containers for API Management Connector deleted');

  logger.log(scriptName, 'Teardown finished');
}
