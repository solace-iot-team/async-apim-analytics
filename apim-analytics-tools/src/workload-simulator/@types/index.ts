export type Server = {
  baseUrl: string;
  admin: {
    username: string;
    password: string;
  }
}

export type Environment = {
  name: string;
  msgVpnName: string;
  endpoints: Record<string, string>;
}

export type Application = {
  name: string;
  environments: string[];
  topics: {
    pub: string[];
    sub: string[];
  }
  credentials: {
    username: string;
    password: string;
  }
}

export type Configuration = {
  server: Server;
  organization: string;
  environments?: string[];
  producers: {
    count: number;
    lifespan: string;
    idleTime: string;
    applications?: string[];
  };
  consumers: {
    count: number;
    lifespan: string;
    applications?: string[];
  };
}
