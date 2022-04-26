import path from 'path';
import s from 'shelljs';
import request from 'supertest';
import server from '../../src/server';
import { logger } from '../lib/test-helper';

const scriptName: string = path.basename(__filename);
const scriptDir: string = path.dirname(__filename);

const connectorServerDirectory = `${scriptDir}/../resources/apim-connector`;

export async function mochaGlobalSetup() {

  // create and start local connector
  const code = s.exec(`bash ${connectorServerDirectory}/setup.sh 2>&1`, { silent: false }).code
  if (code != 0) {
    logger.log(scriptName, 'Setup of API Management Connector failed');
  }

  // start analytics server
  await request(server).get('/').expect(200);

  logger.log(scriptName, 'Setup finished');
}

export async function mochaGlobalTeardown() {

  // stop and remove local connector 
  const code = s.exec(`bash ${connectorServerDirectory}/teardown.sh 2>&1`, { silent: false }).code
  if (code != 0) {
    logger.log(scriptName, 'Teardown of API Management Connector failed');
  }

  logger.log(scriptName, 'Teardown finished');
}
