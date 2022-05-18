import { Constants } from './constants';
import * as utils from './utils';
import { OpenAPI } from "@solace-iot-team/apim-connector-openapi-node";

const connectorHost = utils.getEnvVarAsString('AMAX_SERVER_CONNECTOR_HOST', Constants.DEFAULT_CONNECTOR_HOST);
const connectorPort = utils.getEnvVarAsNumber('AMAX_SERVER_CONNECTOR_PORT', Constants.DEFAULT_CONNECTOR_PORT);

const connectorUsername = utils.getMandatoryEnvVarAsString('AMAX_SERVER_CONNECTOR_USERNAME');
const connectorPassword = utils.getMandatoryEnvVarAsString('AMAX_SERVER_CONNECTOR_PASSWORD');

const configure = (): void => {
  OpenAPI.BASE = `http://${connectorHost}:${connectorPort}/v1`;
  OpenAPI.USERNAME = connectorUsername;
  OpenAPI.PASSWORD = connectorPassword;
}

configure();

export const reset = () => {
  configure();
};

export * from '@solace-iot-team/apim-connector-openapi-node';
