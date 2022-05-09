import {
  AppsService,
  EnvironmentsService,
  OpenAPI,
} from '@solace-iot-team/apim-connector-openapi-node';
import {
  Application,
  Environment,
  Server
} from '../@types';

/**
 * Fetches all environments for an organization.
 * 
 * @param server The API Management Connector server.
 * @param organizationName The name of the organization.
 * 
 * @returns The environments for the organization.
 */
export const getEnvironments = async (server: Server, organizationName: string): Promise<Environment[]> => {

  OpenAPI.BASE = server.baseUrl;
  OpenAPI.USERNAME = server.admin.username;
  OpenAPI.PASSWORD = server.admin.password;

  const environments: Environment[] = [];

  try {

    console.log(`Retrieve environments for '${organizationName}' ..`);

    const envs = await EnvironmentsService.listEnvironments({ organizationName: organizationName });
    const services = await EnvironmentsService.listServices({ organizationName: organizationName });

    for (const env of envs) {

      const service = services.find(service => service.serviceId == env.serviceId);
      if (service) {

        const environment: Environment = {
          name: env.name,
          msgVpnName: service.msgVpnName!,
          endpoints: {},
        }

        const smf = service.messagingProtocols?.find(item => item.protocol?.name == 'smf' || item.protocol?.name == 'smfs');
        if (smf && smf.uri) {
          environment.endpoints['smf'] = smf.uri;
        }

        environments.push(environment);
      }
    }

    console.log(' .. environments retrieved');

  } catch (error: any) {
    console.log(` .. failed to retrieve environments; reason='${error.message}'`);
    throw error;
  }

  return environments;
}

/**
 * Fetches the application details for an application.
 * 
 * @param organizationName The name of the organization.
 * @param applicationName The name of the application.
 * 
 * @returns The application details.
 */
const getApplicationDetails = async (organizationName: string, applicationName: string): Promise<Application> => {

  const appctx = { organizationName: organizationName, appName: applicationName };

  const app = await AppsService.getApp({ ...appctx });

  const application: Application = {
    name: applicationName,
    environments: app.environments?.map(e => e.name || '') || [],
    topics: {
      pub: [],
      sub: [],
    },
    credentials: {
      username: app.credentials.secret!.consumerKey,
      password: app.credentials.secret!.consumerSecret!,
    }
  };

  const apiNames = await AppsService.listAppApiSpecifications({ ...appctx });
  for (const apiName of apiNames) {

    const apiSpec = await AppsService.getAppApiSpecification({ ...appctx, apiName: apiName, format: "application/json" });
    for (const channel in apiSpec.channels) {

      if (apiSpec.channels[channel].subscribe) {
        application.topics.pub.push(channel);
      }
      if (apiSpec.channels[channel].publish) {
        application.topics.sub.push(channel);
      }

    }
  }

  return application;
}

/**
 * Fetches all applications for an organization.
 * 
 * @param server The API Management Connector server.
 * @param organizationName The name of the organization.
 * 
 * @returns The applications for the organization.
 */
export const getApplications = async (server: Server, organizationName: string): Promise<Application[]> => {

  OpenAPI.BASE = server.baseUrl;
  OpenAPI.USERNAME = server.admin.username;
  OpenAPI.PASSWORD = server.admin.password;

  const applications: Application[] = [];

  try {
    console.log(`Retrieve applications for '${organizationName}' ..`);
    const apps = await AppsService.listApps({ organizationName: organizationName });
    for (const app of apps) {
      if (app.name) {
        applications.push(await getApplicationDetails(organizationName, app.name));
      }
    }
    console.log(' .. applications retrieved');
  } catch (error: any) {
    console.log(` .. failed to retrieve applications; reason='${error.message}'`);
    throw error;
  }

  return applications;
}
