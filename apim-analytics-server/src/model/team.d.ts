export type Team = {
  name: string;
  meta: Team.Meta;
}

export namespace Team {
  export type Meta = {
    organization: string;
  }
}
