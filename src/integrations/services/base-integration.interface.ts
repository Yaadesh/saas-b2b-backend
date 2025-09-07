export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_at?: Date;
  token_type?: string;
  scope?: string;
  installation_id?: string; // For GitHub Apps
}

export interface AuthorizationData {
  authorization_url: string;
  state: string;
}

export interface ConnectResponse {
  success: boolean;
  message: string;
  serverInfo?: any;
}

export interface BaseIntegrationService {
  /**
   * Generate authorization URL for OAuth flow
   */
  getAuthorizationUrl(
    orgId: number,
    integrationId: number,
    redirectUri: string,
  ): AuthorizationData;

  /**
   * Exchange authorization code for access token
   */
  exchangeCodeForToken(
    code: string,
    state: string,
    orgId: number,
    redirectUri: string,
  ): Promise<TokenData>;

  /**
   * Store credentials directly (for non-OAuth integrations)
   */
  storeCredentials?(
    orgId: number,
    integrationId: number,
    credentials: Record<string, any>,
  ): Promise<ConnectResponse>;

  /**
   * Store OAuth tokens with encryption
   */
  storeTokens(
    orgId: number,
    integrationId: number,
    tokenData: TokenData,
  ): Promise<void>;

  /**
   * Get decrypted credentials
   */
  getCredentials(orgId: number, integrationId: number): Promise<any | null>;

  /**
   * Refresh access token using refresh token
   */
  refreshToken?(refreshToken: string): Promise<TokenData>;

  /**
   * Validate if token is still valid
   */
  validateToken?(accessToken: string): Promise<boolean>;
}
