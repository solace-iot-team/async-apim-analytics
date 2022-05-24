export type ApiProduct = {
  name: string;
  businessGroup?: string;
  environments: string[];
  meta: ApiProduct.Meta;
}

export namespace ApiProduct {

  export type Meta = {
    organization: string;
  }
}
