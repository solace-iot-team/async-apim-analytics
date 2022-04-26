import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import path from 'path';
import * as fetch from 'node-fetch';
import serverConfig from '../../../dist/common/config';

const scriptName: string = path.basename(__filename);

describe(scriptName, function () {

  const serverPort = process.env.AMAX_SERVER_PORT ?? '8080';
  const healthEndpoint = `http://localhost:${serverPort}/health`;

  // TESTS

  it("should return 'ok' if the server is healthy", async function () {

    const response = await fetch.default(healthEndpoint).catch((reason) => {
      expect.fail(`failed to perform health check; error='${reason}`);
    });

    expect(response.status, 'status is incorrect').to.be.eql(200);

    const data = await response.json();
    expect(data, 'response is incorrect').to.have.property("status", "ok");
  });

  it("should return 'error' if the API Management Connector cannot be accessed", async function () {

    sinon.stub(serverConfig, 'connectorServer').get(() => ({
      baseUrl: 'http://localhost:30814/',
    }));

    const response = await fetch.default(healthEndpoint).catch((reason) => {
      expect.fail(`failed to perform health check; error='${reason}`);
    });

    expect(response.status, 'status is incorrect').to.be.eql(503);

    const data = await response.json();
    expect(data, 'response is incorrect').to.have.property("status", "error");
  });

  it("should return 'error' if Solace PubSub+ Cloud cannot be accessed", async function () {

    sinon.stub(serverConfig, 'pubSubCloudServer').get(() => ({
      baseUrl: 'http://localhost:30815/',
    }));

    const response = await fetch.default(healthEndpoint).catch((reason) => {
      expect.fail(`failed to perform health check; error='${reason}`);
    });

    expect(response.status, 'status is incorrect').to.be.eql(503);

    const data = await response.json();
    expect(data, 'response is incorrect').to.have.property("status", "error");
  });

});
