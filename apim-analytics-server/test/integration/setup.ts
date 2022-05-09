import path from 'path';
import s from 'shelljs';
import request from 'supertest';
import server from '../../dist/server';
import { logger } from '../lib/test-helper';

const scriptName: string = path.basename(__filename);
const scriptDir: string = path.dirname(__filename);

const resourcesDirectory = `${scriptDir}/../resources`;
const connectorServerDirectory = `${resourcesDirectory}/apim-connector`;

const dockerProjectName = 'amax-test';
const dockerCompositeFile = `${connectorServerDirectory}/docker-compose.yml`

export async function mochaGlobalSetup() {

  logger.log(scriptName, 'Setup test environment ...');

  logger.log(scriptName, 'Create containers for API Management Connector ...');
  if (s.exec(`docker-compose -p ${dockerProjectName} -f "${dockerCompositeFile}" up -d --wait`).code != 0) {
    logger.log(scriptName, 'ERROR: failed to create docker containers');
    process.exit(1);
  }
  logger.log(scriptName, 'Containers for API Management Connector created');

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
