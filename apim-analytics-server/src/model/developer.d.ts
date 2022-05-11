export type Developer = {
  userName: string;
  meta: Developer.Meta;
}

export namespace Developer {

  export type Meta = {
    organization: string;
  }
}
