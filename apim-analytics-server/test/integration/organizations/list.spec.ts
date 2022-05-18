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
    enabled: false,
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

  it("should get all organizations", async function () {

    const response = await OrganizationsService.getOrganizations().catch((reason) => {
      expect(reason, `error="${reason.message}"`).is.instanceof(ApiError);
      expect.fail(`failed to get organizations; error="${reason.message}"`);
    });

    expect(response.body, "number of organizations is not correct").to.have.lengthOf(2);

    const names = response.body.map(item => item.name);
    expect(names, "list of organization names is not correct").to.have.members([
      organization1.name,
      organization2.name,
    ]);

    let organization: Organization;

    organization = response.body[names.indexOf(organization1.name)];
    expect(organization, "1st organization is not correct").to.deep.include(organization1);

    organization = response.body[names.indexOf(organization2.name)];
    expect(organization, "2nd organization is not correct").to.deep.include(organization2);
  });

  it("should not get organizations if the user is not authorized", async function () {

    serverapi.setClientUser('unauthorized', 'user');
    await OrganizationsService.getOrganizations().then(() => {
      expect.fail("unauthorized request was not rejected");
    }, (reason) => {
      expect(reason, `error="${reason.message}"`).is.instanceof(ApiError);
      expect(reason.status, "status is not correct").to.be.oneOf([401]);
    });
  });

});
