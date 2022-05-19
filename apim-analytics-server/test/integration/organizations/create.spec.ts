import 'mocha';
import { expect } from 'chai';
import path from 'path';
import { Constants } from '../../lib/constants';
import {
  ApiError,
  OrganizationsService,
  setClientUser,
} from '../../lib/server-api';

import * as setup from './common/test-setup';

const scriptName: string = path.basename(__filename);

describe(scriptName, function () {

  const organizationName: string = Constants.TEST_ORGANIZATION_1;

  // HOOKS

  setup.addBeforeHooks(this);

  afterEach(async function () {
    await OrganizationsService.deleteOrganization({ organizationName }).catch(() => { });
  });

  setup.addAfterHooks(this);

  // TESTS

  it("should create an organization", async function () {

    const request = {
      requestBody: {
        name: organizationName,
      }
    };

    const response = await OrganizationsService.createOrganization(request).catch((reason) => {
      expect(reason, `error="${reason.message}"`).is.instanceof(ApiError);
      expect.fail(`failed to create organization; error="${reason.message}"`);
    });

    expect(response.body, "response is not correct").to.deep.include({
      name: organizationName,
      enabled: true,
    });
  });

  it("should create an organization with enabled status", async function () {

    const request = {
      requestBody: {
        name: organizationName,
        enabled: false,
      }
    };

    const response = await OrganizationsService.createOrganization(request).catch((reason) => {
      expect(reason, `error="${reason.message}"`).is.instanceof(ApiError);
      expect.fail(`failed to create organization; error="${reason.message}"`);
    });

    expect(response.body, "response is not correct").to.deep.include({
      name: organizationName,
      enabled: false,
    });
  });

  it("should not create an organization if the user is not authorized", async function () {

    const request = {
      requestBody: {
        name: organizationName,
      }
    };

    setClientUser('unauthorized', 'user');
    await OrganizationsService.createOrganization(request).then(() => {
      expect.fail("unauthorized request was not rejected");
    }, (reason) => {
      expect(reason, `error="${reason.message}"`).is.instanceof(ApiError);
      expect(reason.status, "status is not correct").to.be.oneOf([401]);
    });
  });

  it("should not create an organization if the name is already used", async function () {

    const request = {
      requestBody: {
        name: organizationName,
      }
    };

    await OrganizationsService.createOrganization(request);
    await OrganizationsService.createOrganization(request).then(() => {
      expect.fail("invalid request was not rejected");
    }, (reason) => {
      expect(reason, `error="${reason.message}"`).is.instanceof(ApiError);
      expect(reason.status, "status is not correct").to.be.oneOf([422]);
    });
  });

  it("should not create an organization if the name is invalid", async function () {

    const request = {
      requestBody: {
        name: '$#:*&++',
      }
    };

    await OrganizationsService.createOrganization(request).then(() => {
      expect.fail("invalid request was not rejected");
    }, (reason) => {
      expect(reason, `error="${reason.message}"`).is.instanceof(ApiError);
      expect(reason.status, "status is not correct").to.be.oneOf([400]);
    });
  });

});
