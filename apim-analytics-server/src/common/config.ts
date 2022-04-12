import 'dotenv/config';
import { Server } from '../models/server';

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

  /** User for the metric endpoint (optional). */
  #user?: {
    username: string;
    password: string;
  }

  /** The organizations. */
  #organizations: string[];

  /** The API-M connector configuration. */
  #connector: Server;

  /** The Solace PubSub+ cloud configuration. */
  #pubSubCloud: Server;

  /**
   * Constructor for server configuration.
   */
  constructor() {

    this.#port = getEnvVarAsNumber('AMAX_SERVER_PORT', 8000);

    const serverUsername = getEnvVarAsString('AMAX_SERVER_USERNAME');
    const serverPassword = getEnvVarAsString('AMAX_SERVER_PASSWORD');

    if (serverUsername && serverPassword) {
      this.#user = { username: serverUsername, password: serverPassword };
    }

    this.#organizations = getMandatoryEnvVarAsString('AMAX_SERVER_ORGANIZATIONS').split(',');

    // initialze configuration for API-M connector

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
      baseUrl: getMandatoryEnvVarAsString('AMAX_SERVER_CONNECTOR_URL'),
      username: connectorUsername,
      password: connectorPassword,
      token: connectorToken
    };

    // initialize configuration for PubSub+ cloud

    this.#pubSubCloud = {
      baseUrl: getEnvVarAsString('AMAX_SERVER_SOLACE_CLOUD_URL', 'https://api.solace.cloud/api/v0'),
      token: getMandatoryEnvVarAsString('AMAX_SERVER_SOLACE_CLOUD_TOKEN'),
    };
  }

  get serverPort(): number {
    return this.#port;
  }

  get serverUser(): { username: string; password: string } | undefined {
    return this.#user;
  }

  get organizations(): string[] {
    return this.#organizations;
  }

  get connectorServer(): Server {
    return this.#connector;
  }

  get pubSubCloudServer(): Server {
    return this.#pubSubCloud;
  }

  asLogData(): any {
    return {
      port: this.#port,
      user: this.#user ? {
        username: this.#user.username,
        password: '***'
      } : undefined,
      connector: {
        baseUrl: this.#connector.baseUrl,
        username: this.#connector.username,
        password: this.#connector.password ? '***' : undefined,
        token: this.#connector.token ? '***' : undefined,
      },
      pubSubCloud: {
        baseUrl: this.#pubSubCloud.baseUrl,
        token: '***'
      },
      organizations: this.#organizations,
    }
  }

} // class ServerConfig

export default new ServerConfig();
