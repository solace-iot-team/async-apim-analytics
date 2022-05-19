declare namespace Components {
    namespace Parameters {
        export type Organization = /* The name of the organization */ Schemas.OrganizationName /* ^[a-zA-Z0-9_-]*$ */;
    }
    export interface PathParameters {
        Organization?: Parameters.Organization;
    }
    namespace Responses {
        export type BadRequest = /* Information about an error */ Schemas.Error;
        export type InternalServerError = /* Information about an error */ Schemas.Error;
        export interface NoContent {
        }
        export type NotFound = /* Information about an error */ Schemas.Error;
        export type Unauthorized = /* Information about an error */ Schemas.Error;
        export type UnsupportedMediaType = /* Information about an error */ Schemas.Error;
    }
    namespace Schemas {
        /**
         * Information about an error
         */
        export interface Error {
            /**
             * A short description of the error
             * example:
             * The request is invalid
             */
            message: string;
            /**
             * A detailed explanation of the error
             */
            details?: /* A detailed explanation of the error */ string | {
                [key: string]: any;
            } | any[];
        }
        /**
         * Information about an organization
         */
        export interface Organization {
            name: /* The name of the organization */ OrganizationName /* ^[a-zA-Z0-9_-]*$ */;
            /**
             * Whether analytics are enabled for the organization
             */
            enabled?: boolean;
        }
        /**
         * The name of the organization
         */
        export type OrganizationName = string; // ^[a-zA-Z0-9_-]*$
        /**
         * Information about an organization patch
         */
        export interface OrganizationPatch {
            /**
             * Whether analytics are enabled for the organization
             */
            enabled?: boolean;
        }
    }
}
declare namespace Paths {
    namespace CreateOrganization {
        export type RequestBody = /* Information about an organization */ Components.Schemas.Organization;
        namespace Responses {
            export type $201 = /* Information about an organization */ Components.Schemas.Organization;
            export type $400 = Components.Responses.BadRequest;
            export type $401 = Components.Responses.Unauthorized;
            export type $415 = Components.Responses.UnsupportedMediaType;
            export type $422 = /* Information about an error */ Components.Schemas.Error;
            export type $500 = Components.Responses.InternalServerError;
        }
    }
    namespace DeleteOrganization {
        namespace Responses {
            export type $204 = Components.Responses.NoContent;
            export type $401 = Components.Responses.Unauthorized;
            export type $404 = Components.Responses.NotFound;
            export type $500 = Components.Responses.InternalServerError;
        }
    }
    namespace GetMetrics {
        namespace Responses {
            export type $200 = string;
            export type $401 = Components.Responses.Unauthorized;
            export type $500 = Components.Responses.InternalServerError;
        }
    }
    namespace GetOrganization {
        namespace Responses {
            export type $200 = /* Information about an organization */ Components.Schemas.Organization;
            export type $401 = Components.Responses.Unauthorized;
            export type $404 = Components.Responses.NotFound;
            export type $500 = Components.Responses.InternalServerError;
        }
    }
    namespace GetOrganizations {
        namespace Responses {
            export type $200 = /* Information about an organization */ Components.Schemas.Organization[];
            export type $401 = Components.Responses.Unauthorized;
            export type $500 = Components.Responses.InternalServerError;
        }
    }
    namespace Organizations$OrganizationName {
        namespace Parameters {
            export type $0 = Components.Parameters.Organization;
        }
    }
    namespace UpdateOrganization {
        export type RequestBody = /* Information about an organization patch */ Components.Schemas.OrganizationPatch;
        namespace Responses {
            export type $200 = /* Information about an organization */ Components.Schemas.Organization;
            export type $400 = Components.Responses.BadRequest;
            export type $401 = Components.Responses.Unauthorized;
            export type $404 = Components.Responses.NotFound;
            export type $415 = Components.Responses.UnsupportedMediaType;
            export type $500 = Components.Responses.InternalServerError;
        }
    }
}
