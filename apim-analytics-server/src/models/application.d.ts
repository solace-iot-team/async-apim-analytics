export type Application = {
  name: string;
  internalName: string;
  apiProducts: string[];
  credentials: {
    username: string;
  },
  meta: Application.Meta;
}

export namespace Application {

  export type Meta = {
    organization: string;
    type: 'team' | 'developer';
    owner: string;
  }
}
