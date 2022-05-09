import fs from 'fs';
import yaml from "js-yaml";
import fetch from 'node-fetch';
import {
  AdministrationService,
  ApiProductsService,
  ApisService,
  App,
  AppsService,
  ClientOptions,
  ClientOptionsGuaranteedMessaging,
  EnvironmentsService,
  OpenAPI,
  Protocol,
  Service,
  WebHook,
} from '@solace-iot-team/apim-connector-openapi-node';
import {
  ApiProductResource,
  ApiResource,
  ApplicationResource,
  EnvironmentResource,
  ResourceSet
} from '../@types';

// EXPORTS and HELPERS

/**
 * Creates the organization for the organization resource of a resource set.
 * 
 * @param resourceSet The resource set.
 */
export const createOrganization = async (resourceSet: ResourceSet): Promise<void> => {

  OpenAPI.BASE = resourceSet.server.baseUrl;
  OpenAPI.USERNAME = resourceSet.server.admin.username;
  OpenAPI.PASSWORD = resourceSet.server.admin.password;

  const organization = resourceSet.organization;

  try {

    console.log(`Create organization '${organization.name}' .. `);

    const request = {
      requestBody: {
        name: organization.name,
        'cloud-token': organization.token,
      }
    }

    await AdministrationService.createOrganization(request);
    console.log(' .. organziation was created');

  } catch (error: any) {
    console.log(` .. failed to create organization; reason='${error.message}'`);
    throw error;
  }
}

/**
 * Deletes the organization for the organization resource of a resource set.
 * 
 * @param resourceSet The resource set.
 */
export const deleteOrganization = async (resourceSet: ResourceSet): Promise<void> => {

  OpenAPI.BASE = resourceSet.server.baseUrl;
  OpenAPI.USERNAME = resourceSet.server.admin.username;
  OpenAPI.PASSWORD = resourceSet.server.admin.password;

  const organization = resourceSet.organization;

  try {
    console.log(`Delete organization '${organization.name}' .. `);
    await AdministrationService.deleteOrganization({ organizationName: organization.name });
    console.log(' .. organziation was deleted');
  } catch (error: any) {
    console.log(` .. failed to delete organization; reason='${error.message}'`);
    throw error;
  }
}

/**
 * Creates the environment for an environment resource.
 * 
 * @param resourceSet The resource set.
 * @param environmentResource The environment resource.
 */
const createEnvironment = async (resourceSet: ResourceSet, environmentResource: EnvironmentResource): Promise<void> => {

  OpenAPI.BASE = resourceSet.server.baseUrl;
  OpenAPI.USERNAME = resourceSet.organization.admin.username;
  OpenAPI.PASSWORD = resourceSet.organization.admin.password;

  const organization = resourceSet.organization;

  let services: Service[];
  try {
    services = await EnvironmentsService.listServices({ organizationName: organization.name });
  } catch (all) {
    throw new Error('Failed to lookup service');
  }

  const nameOrId = environmentResource.service;
  const service = services.find(item => {
    return ((item.name?.toLowerCase() == nameOrId.toLowerCase()) || (item.serviceId == nameOrId));
  });

  if (service === undefined) {
    throw new Error(`Service ${nameOrId} is unknown`);
  }

  const exposedProtocols: Protocol[] = [];
  service?.messagingProtocols?.forEach(endpoint => {
    if (endpoint.protocol) {
      exposedProtocols.push(endpoint.protocol);
    }
  });

  const request = {
    organizationName: organization.name,
    requestBody: {
      name: environmentResource.name,
      description: `Environment for service ${service.name}`,
      serviceId: service.serviceId ?? '',
      exposedProtocols: exposedProtocols,
    }
  }

  await EnvironmentsService.createEnvironment(request);
}

/**
 * Creates environments for all environment resources in a resource set.
 * 
 * @param resourceSet The resource set.
 */
export const createEnvironments = async (resourceSet: ResourceSet): Promise<void> => {

  for (const environment of resourceSet.environments) {

    try {
      console.log(`Create environment '${environment.name}' .. `);
      await createEnvironment(resourceSet, environment);
      console.log(' .. environment was created');
    } catch (error: any) {
      console.log(` .. failed to create environment; reason='${error.message}'`);
      throw error;
    }
  }
}

/**
 * Creates the API for an API resource.
 * 
 * @param resourceSet The resource set.
 * @param apiResource The API resource.
 */
const createApi = async (resourceSet: ResourceSet, apiResource: ApiResource): Promise<void> => {

  OpenAPI.BASE = resourceSet.server.baseUrl;
  OpenAPI.USERNAME = resourceSet.organization.admin.username;
  OpenAPI.PASSWORD = resourceSet.organization.admin.password;

  const organization = resourceSet.organization;

  let apiSpec: string;
  if (apiResource.uri.startsWith('http://') || apiResource.uri.startsWith('https://')) {
    apiSpec = await fetch(apiResource.uri).then(response => response.text());
  } else {
    apiSpec = fs.readFileSync(apiResource.uri).toString();
  }

  try {
    apiSpec = JSON.stringify(yaml.load(apiSpec));
  } catch (all) {
    // ignore
  }

  const request = {
    organizationName: organization.name,
    apiName: apiResource.name,
    requestBody: apiSpec,
  }

  await ApisService.createApi(request);
}

/**
 * Creates APIs for all API resources in a resource set.
 * 
 * @param resourceSet The resource set.
 */
export const createApis = async (resourceSet: ResourceSet): Promise<void> => {

  for (const api of resourceSet.apis) {

    try {
      console.log(`Create API '${api.name}' .. `);
      await createApi(resourceSet, api);
      console.log(' .. API was created');
    } catch (error: any) {
      console.log(` .. failed to create API; reason='${error.message}'`);
      throw error;
    }
  }
}

/**
 * Creates the API product for an API-product resource.
 * 
 * @param resourceSet The resource set.
 * @param apiProductResource The API-product resource.
 */
const createApiProduct = async (resourceSet: ResourceSet, apiProductResource: ApiProductResource): Promise<void> => {

  OpenAPI.BASE = resourceSet.server.baseUrl;
  OpenAPI.USERNAME = resourceSet.organization.admin.username;
  OpenAPI.PASSWORD = resourceSet.organization.admin.password;

  const organization = resourceSet.organization;
  const environments = apiProductResource.environments ?? resourceSet.environments.map(item => item.name);

  const protocols = new Set<string>();
  try {
    const orgctx = { organizationName: organization.name };
    for (const environment of environments) {
      await EnvironmentsService.getEnvironment({ ...orgctx, envName: environment }).then(response => {
        response.exposedProtocols?.forEach(protocol => { protocols.add(protocol.name) });
      });
    }
  } catch (all) {
    throw new Error('Failed to lookup environments');
  }

  let clientOptions: ClientOptions | undefined;
  if (apiProductResource.guaranteedMessaging) {
    clientOptions = {
      guaranteedMessaging: {
        accessType: ClientOptionsGuaranteedMessaging.accessType.EXCLUSIVE,
        maxTtl: 3600,
        maxMsgSpoolUsage: 1,
        requireQueue: true,
      }
    }
  }

  const request = {
    organizationName: organization.name,
    requestBody: {
      name: apiProductResource.name,
      displayName: apiProductResource.name,
      apis: apiProductResource.apis ?? [],
      attributes: [],
      environments: environments,
      pubResources: [],
      subResources: [],
      protocols: Array.from(protocols).map(name => ({ name: name } as Protocol)),
      clientOptions: clientOptions,
    }
  }

  await ApiProductsService.createApiProduct(request);
}

/**
 * Creates API products for all API-product resources in a resource set.
 * 
 * @param resourceSet The resource set.
 */
export const createApiProducts = async (resourceSet: ResourceSet): Promise<void> => {

  for (const apiProduct of resourceSet.apiProducts) {

    try {
      console.log(`Create API product '${apiProduct.name}' .. `);
      await createApiProduct(resourceSet, apiProduct);
      console.log(' .. API product was created');
    } catch (error: any) {
      console.log(` .. failed to create API product; reason='${error.message}'`);
      throw error;
    }
  }
}

const createApplication = async (resourceSet: ResourceSet, applicationResource: ApplicationResource): Promise<void> => {

  OpenAPI.BASE = resourceSet.server.baseUrl;
  OpenAPI.USERNAME = resourceSet.organization.admin.username;
  OpenAPI.PASSWORD = resourceSet.organization.admin.password;

  const organization = resourceSet.organization;

  const application: App = {
    name: applicationResource.name,
    apiProducts: applicationResource.apiProducts,
    webHooks: applicationResource.webHooks?.map(hook => ({
      uri: hook.uri,
      method: hook.method == 'PUT' ? WebHook.method.PUT : WebHook.method.POST,
      mode: WebHook.mode.SERIAL,
      environments: hook.environments,
    })),
    credentials: {
      expiresAt: -1,
    }
  }

  if (applicationResource.credentials) {
    application.credentials.secret = {
      consumerKey: applicationResource.credentials.username,
      consumerSecret: applicationResource.credentials.password,
    }
  }

  if (applicationResource.type === 'developer') {

    const request = {
      organizationName: organization.name,
      developerUsername: applicationResource.owner,
      requestBody: application,
    }
    await AppsService.createDeveloperApp(request);

  } else if (applicationResource.type === 'team') {

    const request = {
      organizationName: organization.name,
      teamName: applicationResource.owner,
      requestBody: application,
    }
    await AppsService.createTeamApp(request);
  }
}

/**
 * Creates applications for all application resources in a resource set.
 * 
 * @param resourceSet The resource set.
 */
export const createApplications = async (resourceSet: ResourceSet): Promise<void> => {

  for (const applications of resourceSet.applications) {

    try {
      console.log(`Create application '${applications.name}' .. `);
      await createApplication(resourceSet, applications);
      console.log(' .. application was created');
    } catch (error: any) {
      console.log(` .. failed to create application; reason='${error.message}'`);
      throw error;
    }
  }
}
