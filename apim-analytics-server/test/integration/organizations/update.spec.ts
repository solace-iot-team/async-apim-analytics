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

  const orgctx = {
    organizationName: organizationName,
  };

  // HOOKS

  setup.addBeforeHooks(this);

  afterEach(async function () {
    await OrganizationsService.deleteOrganization({ ...orgctx }).catch(() => { });
  });

  setup.addAfterHooks(this);

  // TESTS

  it("should update the enabled status", async function () {

    const createRequest = {
      requestBody: {
        name: organizationName,
      }
    };

    await OrganizationsService.createOrganization(createRequest);

    const updateRequest = {
      ...orgctx,
      requestBody: {
        enabled: false,
      }
    };

    const response = await OrganizationsService.updateOrganization(updateRequest).catch((reason) => {
      expect(reason, `error="${reason.message}"`).is.instanceof(ApiError);
      expect.fail(`failed to update organization; error="${reason.message}"`);
    });

    expect(response.body, "response is not correct").to.deep.include({
      name: organizationName,
      enabled: false,
    });
  });

  it("should not update an organization if the user is not authorized", async function () {

    const createRequest = {
      requestBody: {
        name: organizationName,
      }
    };

    await OrganizationsService.createOrganization(createRequest);

    const updateRequest = {
      ...orgctx,
      requestBody: {
        enabled: false,
      }
    };

    setClientUser('unauthorized', 'user');
    await OrganizationsService.updateOrganization(updateRequest).then(() => {
      expect.fail("unauthorized request was not rejected");
    }, (reason) => {
      expect(reason, `error="${reason.message}"`).is.instanceof(ApiError);
      expect(reason.status, "status is not correct").to.be.oneOf([401]);
    });
  });

  it("should not update an organization that does not exist", async function () {

    const updateRequest = {
      ...orgctx,
      requestBody: {
        enabled: false,
      }
    };

    await OrganizationsService.updateOrganization(updateRequest).then(() => {
      expect.fail("invalid request was not rejected");
    }, (reason) => {
      expect(reason, `error="${reason.message}"`).is.instanceof(ApiError);
      expect(reason.status, "status is not correct").to.be.oneOf([404]);
    });
  });

});
