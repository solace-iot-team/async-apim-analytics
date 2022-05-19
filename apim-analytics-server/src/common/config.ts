import 'dotenv/config';
import { Constants } from './constants';
import { Database } from '../model/database';
import { Server } from '../model/server';

// HELPER

function getEnvVarAsString(name: string): string | undefined;
function getEnvVarAsString(name: string, defaultValue: string): string;

function getEnvVarAsString(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}

function getEnvVarAsNumber(name: string): number | undefined;
function getEnvVarAsNumber(name: string, defaultValue: number): number;

function getEnvVarAsNumber(name: string, defaultValue?: number): number | undefined {
  let value: number | undefined;
  const valueAsString = process.env[name];
  if (valueAsString) {
    value = parseInt(valueAsString);
    if (Number.isNaN(value)) throw new Error(`value for environment variable '${name} is not a number`);
  }
  return value || defaultValue;
}

function getMandatoryEnvVarAsString(name: string): string {
  const value = getEnvVarAsString(name);
  if (!value) throw new Error(`environment variable '${name} is missing`);
  return value;
}

// EXPORTS

/** The server configuration. */
export class ServerConfig {

  /** The port. */
  #port: number;

  /** User for the REST API (optional). */
  #user?: {
    username: string;
    password: string;
  }

  /** The database. */
  #database: Database;

  /** The API Management connector configuration. */
  #connector: Server;

  /**
   * Constructor for server configuration.
   */
  constructor() {

    this.#port = getEnvVarAsNumber('AMAX_SERVER_PORT', Constants.DEFAULT_SERVER_PORT);

    const serverUsername = getEnvVarAsString('AMAX_SERVER_USERNAME');
    const serverPassword = getEnvVarAsString('AMAX_SERVER_PASSWORD');

    if (serverUsername && serverPassword) {
      this.#user = { username: serverUsername, password: serverPassword };
    }

    // initialize configuration for database

    this.#database = {
      url: getMandatoryEnvVarAsString('AMAX_SERVER_MONGODB_URL'),
    };

    // initialze configuration for API-M connector

    const connectorHost = getEnvVarAsString('AMAX_SERVER_CONNECTOR_HOST', Constants.DEFAULT_CONNECTOR_HOST);
    const connectorPort = getEnvVarAsNumber('AMAX_SERVER_CONNECTOR_PORT', Constants.DEFAULT_CONNECTOR_PORT);

    const connectorUsername = getEnvVarAsString('AMAX_SERVER_CONNECTOR_USERNAME');
    const connectorPassword = getEnvVarAsString('AMAX_SERVER_CONNECTOR_PASSWORD');
    const connectorToken = getEnvVarAsString('AMAX_SERVER_CONNECTOR_TOKEN');

    const hasConnectorUsernamePassword = (connectorUsername && connectorPassword);
    const hasConnectorToken = connectorToken != undefined;

    if (hasConnectorUsernamePassword && hasConnectorToken) {
      throw new Error("invalid configuration: API-M connector username/password and token are set");
    }

    if (!hasConnectorUsernamePassword && !hasConnectorToken) {
      throw new Error("invalid configuration: API-M connector username/password and token are missing");
    }

    this.#connector = {
      baseUrl: `http://${connectorHost}:${connectorPort}/v1`,
      username: connectorUsername,
      password: connectorPassword,
      token: connectorToken
    };
  }

  get serverPort(): number {
    return this.#port;
  }

  get serverUser(): { username: string; password: string } | undefined {
    return this.#user;
  }

  get database(): Database {
    return this.#database;
  }

  get connectorServer(): Server {
    return this.#connector;
  }

  asLogData(): any {
    return {
      port: this.#port,
      user: this.#user ? {
        username: this.#user.username,
        password: '***'
      } : undefined,
      database: {
        url: this.#database.url,
      },
      connector: {
        baseUrl: this.#connector.baseUrl,
        username: this.#connector.username,
        password: this.#connector.password ? '***' : undefined,
        token: this.#connector.token ? '***' : undefined,
      },
    }
  }

} // class ServerConfig

export default new ServerConfig();
