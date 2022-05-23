export type Environment = {
  name: string;
  msgVpnName: string;
  serviceId: string;
  datacenterId: string;
  meta: Environment.Meta;
}

export namespace Environment {

  export type Meta = {
    organization: string;
  }
}
