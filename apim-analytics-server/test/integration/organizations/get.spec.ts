import 'mocha';
import { expect } from 'chai';
import path from 'path';
import { Constants } from '../../lib/constants';
import * as serverapi from '../../lib/server-api';
import {
  ApiError,
  Organization,
  OrganizationsService,
} from '../../lib/server-api';

import * as setup from './common/test-setup';

const scriptName: string = path.basename(__filename);

describe(scriptName, function () {

  const organization1: Organization = {
    name: Constants.TEST_ORGANIZATION_1,
    enabled: true,
  };

  const organization2: Organization = {
    name: Constants.TEST_ORGANIZATION_2,
    enabled: true,
  };

  // HOOKS

  setup.addBeforeHooks(this);

  before(async function () {
    await Promise.all([
      OrganizationsService.createOrganization({ requestBody: organization1 }),
      OrganizationsService.createOrganization({ requestBody: organization2 }),
    ]);
  });

  after(async function () {
    await Promise.all([
      OrganizationsService.deleteOrganization({ organizationName: organization1.name }),
      OrganizationsService.deleteOrganization({ organizationName: organization2.name }),
    ]);
  });

  setup.addAfterHooks(this);

  // TESTS

  it("should get an organization", async function () {

    const response = await OrganizationsService.getOrganization({ organizationName: organization1.name }).catch((reason) => {
      expect(reason, `error="${reason.message}"`).is.instanceof(ApiError);
      expect.fail(`failed to get organization; error="${reason.message}"`);
    });

    expect(response.body, "response is not correct").to.deep.include(organization1);
  });

  it("should not get an organization if the user is not authorized", async function () {

    serverapi.setClientUser('unauthorized', 'user');
    await OrganizationsService.getOrganization({ organizationName: organization1.name }).then(() => {
      expect.fail("unauthorized request was not rejected");
    }, (reason) => {
      expect(reason, `error="${reason.message}"`).is.instanceof(ApiError);
      expect(reason.status, "status is not correct").to.be.oneOf([401]);
    });
  });

  it("should not get an organization that does not exist", async function () {

    await OrganizationsService.getOrganization({ organizationName: 'unknown' }).then(() => {
      expect.fail("invalid request was not rejected");
    }, (reason) => {
      expect(reason, `error="${reason.message}"`).is.instanceof(ApiError);
      expect(reason.status, "status is not correct").to.be.oneOf([404]);
    });
  });

});
