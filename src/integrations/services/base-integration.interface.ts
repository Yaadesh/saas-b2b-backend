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
   * Refresh access token using refresh token
   */
  refreshToken?(refreshToken: string): Promise<TokenData>;

  /**
   * Validate if token is still valid
   */
  validateToken?(accessToken: string): Promise<boolean>;
}
