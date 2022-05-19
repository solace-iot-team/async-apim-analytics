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

  const organizationName: string = Constants.TEST_ORGANIZATION_1;

  const organization: Organization = {
    name: organizationName,
    enabled: true,
  };

  // HOOKS

  setup.addBeforeHooks(this);

  beforeEach(async function () {
    await OrganizationsService.createOrganization({ requestBody: organization });
  });

  afterEach(async function () {
    serverapi.reset();
    await OrganizationsService.deleteOrganization({ organizationName }).catch(() => { });
  });

  setup.addAfterHooks(this);

  // TESTS

  it("should delete an organization", async function () {

    await OrganizationsService.deleteOrganization({ organizationName }).catch((reason) => {
      expect(reason, `error="${reason.message}"`).is.instanceof(ApiError);
      expect.fail(`failed to delete organization; error="${reason.message}"`);
    });
  });

  it("should not delete an organization if the user is not authorized", async function () {

    serverapi.setClientUser('unauthorized', 'user');
    await OrganizationsService.deleteOrganization({ organizationName }).then(() => {
      expect.fail("unauthorized request was not rejected");
    }, (reason) => {
      expect(reason, `error="${reason.message}"`).is.instanceof(ApiError);
      expect(reason.status, "status is not correct").to.be.oneOf([401]);
    });
  });

  it("should not delete an organization that does not exist", async function () {

    await OrganizationsService.deleteOrganization({ organizationName: 'unknown' }).then(() => {
      expect.fail("invalid request was not rejected");
    }, (reason) => {
      expect(reason, `error="${reason.message}"`).is.instanceof(ApiError);
      expect(reason.status, "status is not correct").to.be.oneOf([404]);
    });
  });

});
