import { Constants } from './constants';
import * as utils from './utils';
import { OpenAPI } from './generated/openapi';

const serverPort = utils.getEnvVarAsNumber('AMAX_SERVER_PORT', Constants.DEFAULT_SERVER_PORT);

const serverUsername = utils.getMandatoryEnvVarAsString('AMAX_SERVER_USERNAME');
const serverPassword = utils.getMandatoryEnvVarAsString('AMAX_SERVER_PASSWORD');

const configure = () => {
  OpenAPI.BASE = `http://localhost:${serverPort}/v1`;
  OpenAPI.USERNAME = serverUsername;
  OpenAPI.PASSWORD = serverPassword;
}

configure();

export const setClientUser = (username: string, password: string) => {
  OpenAPI.USERNAME = username;
  OpenAPI.PASSWORD = password;
}

export const reset = () => {
  configure();
};

export * from './generated/openapi';
