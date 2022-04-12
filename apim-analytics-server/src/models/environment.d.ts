export type Environment = {
  name: string;
  vpnName: string;
  serviceId: string;
  meta: Environment.Meta;
}

export namespace Environment {

  export type Meta = {
    organization: string;
  }
}
