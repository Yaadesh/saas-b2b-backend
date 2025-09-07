import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfluenceService } from '../../integrations/services/confluence.service';
import { OrgIntegrationKeysRepository } from '../../integrations/repositories/org-integration-keys.repository';
import { ConfluenceDocument } from '../entities/module.entity';

@Injectable()
export class ConfluenceSearchService {
  constructor(
    private readonly configService: ConfigService,
    private readonly confluenceService: ConfluenceService,
    private readonly orgIntegrationKeysRepository: OrgIntegrationKeysRepository,
  ) {}

  /**
   * Search Confluence documents for an organization
   */
  async searchDocuments(
    orgId: number,
    integrationId: number,
    searchTerm: string,
    limit = 10,
  ): Promise<{ results: ConfluenceDocument[]; total: number }> {
    try {
      // Get stored Confluence credentials
      const credentials = await this.confluenceService.getCredentials(orgId, integrationId);
      
      if (!credentials || !credentials.access_token) {
        throw new BadRequestException('Confluence not connected for this organization');
      }

      // Get accessible resources
      const resourcesResponse = await fetch(
        'https://api.atlassian.com/oauth/token/accessible-resources',
        {
          headers: {
            'Authorization': `Bearer ${credentials.access_token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!resourcesResponse.ok) {
        throw new BadRequestException('Failed to get Confluence resources');
      }

      const resources = await resourcesResponse.json();
      
      if (!resources || resources.length === 0) {
        return { results: [], total: 0 };
      }

      const cloudId = resources[0].id;
      const baseUrl = resources[0].url;

      // Search for content using Confluence REST API
      const searchUrl = new URL(`${baseUrl}/wiki/rest/api/content/search`);
      searchUrl.searchParams.append('cql', `text ~ "${searchTerm}" AND type = page`);
      searchUrl.searchParams.append('limit', limit.toString());
      searchUrl.searchParams.append('expand', 'space,version,ancestors');

      const searchResponse = await fetch(searchUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Accept': 'application/json',
        },
      });

      if (!searchResponse.ok) {
        throw new BadRequestException('Failed to search Confluence documents');
      }

      const searchResults = await searchResponse.json();

      const documents: ConfluenceDocument[] = searchResults.results?.map((result: any) => ({
        id: result.id,
        title: result.title,
        url: `${baseUrl}/wiki${result._links.webui}`,
        spaceKey: result.space?.key || '',
        spaceName: result.space?.name || '',
      })) || [];

      return {
        results: documents,
        total: searchResults.totalSize || documents.length,
      };
    } catch (error) {
      throw new BadRequestException(`Confluence search failed: ${error.message}`);
    }
  }

  /**
   * Get recent Confluence documents
   */
  async getRecentDocuments(
    orgId: number,
    integrationId: number,
    limit = 10,
  ): Promise<{ results: ConfluenceDocument[]; total: number }> {
    try {
      // Get stored Confluence credentials
      const credentials = await this.confluenceService.getCredentials(orgId, integrationId);
      
      if (!credentials || !credentials.access_token) {
        throw new BadRequestException('Confluence not connected for this organization');
      }

      // Get accessible resources
      const resourcesResponse = await fetch(
        'https://api.atlassian.com/oauth/token/accessible-resources',
        {
          headers: {
            'Authorization': `Bearer ${credentials.access_token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!resourcesResponse.ok) {
        throw new BadRequestException('Failed to get Confluence resources');
      }

      const resources = await resourcesResponse.json();
      
      if (!resources || resources.length === 0) {
        return { results: [], total: 0 };
      }

      const baseUrl = resources[0].url;

      // Get recent content
      const contentUrl = new URL(`${baseUrl}/wiki/rest/api/content`);
      contentUrl.searchParams.append('type', 'page');
      contentUrl.searchParams.append('status', 'current');
      contentUrl.searchParams.append('limit', limit.toString());
      contentUrl.searchParams.append('orderby', 'created');
      contentUrl.searchParams.append('expand', 'space,version');

      const contentResponse = await fetch(contentUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Accept': 'application/json',
        },
      });

      if (!contentResponse.ok) {
        throw new BadRequestException('Failed to get recent Confluence documents');
      }

      const contentResults = await contentResponse.json();

      const documents: ConfluenceDocument[] = contentResults.results?.map((result: any) => ({
        id: result.id,
        title: result.title,
        url: `${baseUrl}/wiki${result._links.webui}`,
        spaceKey: result.space?.key || '',
        spaceName: result.space?.name || '',
      })) || [];

      return {
        results: documents,
        total: contentResults.size || documents.length,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get recent documents: ${error.message}`);
    }
  }

  /**
   * Get Confluence spaces
   */
  async getSpaces(
    orgId: number,
    integrationId: number,
    limit = 25,
  ): Promise<{ results: Array<{ key: string; name: string; type: string }>; total: number }> {
    try {
      // Get stored Confluence credentials
      const credentials = await this.confluenceService.getCredentials(orgId, integrationId);
      
      if (!credentials || !credentials.access_token) {
        throw new BadRequestException('Confluence not connected for this organization');
      }

      // Get accessible resources
      const resourcesResponse = await fetch(
        'https://api.atlassian.com/oauth/token/accessible-resources',
        {
          headers: {
            'Authorization': `Bearer ${credentials.access_token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!resourcesResponse.ok) {
        throw new BadRequestException('Failed to get Confluence resources');
      }

      const resources = await resourcesResponse.json();
      
      if (!resources || resources.length === 0) {
        return { results: [], total: 0 };
      }

      const baseUrl = resources[0].url;

      // Get spaces
      const spacesUrl = new URL(`${baseUrl}/wiki/rest/api/space`);
      spacesUrl.searchParams.append('limit', limit.toString());

      const spacesResponse = await fetch(spacesUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Accept': 'application/json',
        },
      });

      if (!spacesResponse.ok) {
        throw new BadRequestException('Failed to get Confluence spaces');
      }

      const spacesResults = await spacesResponse.json();

      const spaces = spacesResults.results?.map((space: any) => ({
        key: space.key,
        name: space.name,
        type: space.type,
      })) || [];

      return {
        results: spaces,
        total: spacesResults.size || spaces.length,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get spaces: ${error.message}`);
    }
  }
}