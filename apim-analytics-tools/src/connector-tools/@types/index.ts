export type Server = {
  baseUrl: string;
  admin: {
    username: string;
    password: string;
  }
}

export type OrganizationResource = {
  name: string;
  token: string;
  admin: {
    username: string;
    password: string;
  }
}

export type EnvironmentResource = {
  name: string;
  service: string;
}

export type ApiResource = {
  name: string;
  uri: string;
}

export type ApiProductResource = {
  name: string;
  apis: string[];
  environments?: string[];
  guaranteedMessaging?: boolean;
}

export type WebHookResource = {
  uri: string;
  method: 'PUT' | 'POST';
  environments?: string[];
}

export type ApplicationResource = {
  name: string;
  type: 'team' | 'developer';
  owner: string;
  apiProducts: string[];
  webHooks?: WebHookResource[];
  credentials?: {
    username: string;
    password?: string;
  }
}

export type ResourceSet = {
  server: Server;
  organization: OrganizationResource;
  environments: EnvironmentResource[];
  apis: ApiResource[];
  apiProducts: ApiProductResource[];
  applications: ApplicationResource[];
}