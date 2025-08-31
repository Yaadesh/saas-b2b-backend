export class ScimBulkDto {
  supported: boolean;
  maxOperations: number;
  maxPayloadSize: number;
}

export class ScimFilterDto {
  supported: boolean;
  maxResults: number;
}

export class ScimChangePasswordDto {
  supported: boolean;
}

export class ScimPatchDto {
  supported: boolean;
}

export class ScimSortDto {
  supported: boolean;
}

export class ScimETagDto {
  supported: boolean;
}

export class ScimAuthenticationSchemeDto {
  name: string;
  description: string;
  specUri?: string;
  documentationUri?: string;
  type: string;
  primary?: boolean;
}

export class ScimServiceProviderConfigDto {
  schemas: string[];
  documentationUri?: string;
  patch: ScimPatchDto;
  bulk: ScimBulkDto;
  filter: ScimFilterDto;
  changePassword: ScimChangePasswordDto;
  sort: ScimSortDto;
  etag: ScimETagDto;
  authenticationSchemes: ScimAuthenticationSchemeDto[];
  meta: {
    location: string;
    resourceType: string;
    created: string;
    lastModified: string;
    version: string;
  };
}
