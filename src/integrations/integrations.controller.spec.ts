import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { IntegrationFactoryService } from './services/integration-factory.service';
import { GetIntegrationsResponseDto } from './dto/get-integrations-response.dto';

describe('IntegrationsController', () => {
  let controller: IntegrationsController;
  let integrationsService: IntegrationsService;
  let integrationFactoryService: IntegrationFactoryService;

  const mockIntegrationsService = {
    findIntegrationsByOrgId: jest.fn(),
    findIntegrationByOrgAndId: jest.fn(),
    generateHeaderToken: jest.fn(),
    connectIntegration: jest.fn(),
    handleCallback: jest.fn(),
  };

  const mockIntegrationFactoryService = {
    connectWithCredentials: jest.fn(),
    handleCallback: jest.fn(),
  };

  const mockAuthenticatedRequest = {
    user: {
      userId: '123',
      email: 'test@example.com',
      orgId: 1,
      payload: {},
      user: {},
    },
  };

  const mockIntegrationsResponse: GetIntegrationsResponseDto = {
    integrations: [
      {
        id: 1,
        name: 'okta',
        is_enabled: true,
        created_at: new Date('2024-01-01T00:00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00:00.000Z'),
        meta_data: {
          display_name: 'Okta',
          subtext: 'Identity provider',
        },
        integration_type: 1,
        org_integration_status: null,
      },
      {
        id: 2,
        name: 'confluence',
        is_enabled: true,
        created_at: new Date('2024-01-01T00:00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00:00.000Z'),
        meta_data: {
          display_name: 'Confluence',
          subtext: 'Documentation platform',
        },
        integration_type: 1,
        org_integration_status: 1,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntegrationsController],
      providers: [
        {
          provide: IntegrationsService,
          useValue: mockIntegrationsService,
        },
        {
          provide: IntegrationFactoryService,
          useValue: mockIntegrationFactoryService,
        },
      ],
    }).compile();

    controller = module.get<IntegrationsController>(IntegrationsController);
    integrationsService = module.get<IntegrationsService>(IntegrationsService);
    integrationFactoryService = module.get<IntegrationFactoryService>(
      IntegrationFactoryService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getIntegrations', () => {
    it('should return all integrations when no type filter', async () => {
      mockIntegrationsService.findIntegrationsByOrgId.mockResolvedValue(
        mockIntegrationsResponse,
      );

      const result = await controller.getIntegrations(
        mockAuthenticatedRequest as any,
      );

      expect(result).toEqual(mockIntegrationsResponse);
      expect(mockIntegrationsService.findIntegrationsByOrgId).toHaveBeenCalledWith(
        1,
        undefined,
      );
    });

    it('should return filtered integrations when type is specified', async () => {
      const filteredResponse = {
        integrations: [mockIntegrationsResponse.integrations[0]],
      };
      mockIntegrationsService.findIntegrationsByOrgId.mockResolvedValue(
        filteredResponse,
      );

      const result = await controller.getIntegrations(
        mockAuthenticatedRequest as any,
        1,
      );

      expect(result).toEqual(filteredResponse);
      expect(mockIntegrationsService.findIntegrationsByOrgId).toHaveBeenCalledWith(
        1,
        1,
      );
    });

    it('should throw UnauthorizedException when orgId is null', async () => {
      const requestWithoutOrgId = {
        user: {
          ...mockAuthenticatedRequest.user,
          orgId: null,
        },
      };

      await expect(
        controller.getIntegrations(requestWithoutOrgId as any),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockIntegrationsService.findIntegrationsByOrgId).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockIntegrationsService.findIntegrationsByOrgId.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        controller.getIntegrations(mockAuthenticatedRequest as any),
      ).rejects.toThrow('Database error');
    });
  });

  describe('getIntegrationById', () => {
    const mockIntegrationResponse = {
      integration: mockIntegrationsResponse.integrations[0],
    };

    it('should return specific integration', async () => {
      mockIntegrationsService.findIntegrationByOrgAndId.mockResolvedValue(
        mockIntegrationResponse,
      );

      const result = await controller.getIntegrationById(
        mockAuthenticatedRequest as any,
        1,
      );

      expect(result).toEqual(mockIntegrationResponse);
      expect(mockIntegrationsService.findIntegrationByOrgAndId).toHaveBeenCalledWith(
        1,
        1,
      );
    });

    it('should throw UnauthorizedException when orgId is null', async () => {
      const requestWithoutOrgId = {
        user: {
          ...mockAuthenticatedRequest.user,
          orgId: null,
        },
      };

      await expect(
        controller.getIntegrationById(requestWithoutOrgId as any, 1),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockIntegrationsService.findIntegrationByOrgAndId).not.toHaveBeenCalled();
    });
  });

  describe('generateHeaderToken', () => {
    const mockTokenResponse = {
      header_token: 'jwt-token-here',
    };

    it('should generate header token successfully', async () => {
      mockIntegrationsService.generateHeaderToken.mockResolvedValue(mockTokenResponse);

      const result = await controller.generateHeaderToken(
        mockAuthenticatedRequest as any,
        { integration_id: 1 },
      );

      expect(result).toEqual(mockTokenResponse);
      expect(mockIntegrationsService.generateHeaderToken).toHaveBeenCalledWith(
        1,
        1,
      );
    });

    it('should throw BadRequestException when integration_id is missing', async () => {
      await expect(
        controller.generateHeaderToken(mockAuthenticatedRequest as any, {} as any),
      ).rejects.toThrow(BadRequestException);

      expect(mockIntegrationsService.generateHeaderToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when orgId is null', async () => {
      const requestWithoutOrgId = {
        user: {
          ...mockAuthenticatedRequest.user,
          orgId: null,
        },
      };

      await expect(
        controller.generateHeaderToken(requestWithoutOrgId as any, {
          integration_id: 1,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('connectIntegration', () => {
    const mockConnectResponse = {
      success: true,
      authorization_url: 'https://example.com/oauth',
    };

    it('should connect OAuth integration successfully', async () => {
      mockIntegrationsService.findIntegrationByOrgAndId.mockResolvedValue({
        integration: { id: 1, name: 'github' },
      });
      mockIntegrationsService.connectIntegration.mockResolvedValue(mockConnectResponse);

      const result = await controller.connectIntegration(
        mockAuthenticatedRequest as any,
        { integration_id: 1 },
      );

      expect(result).toEqual(mockConnectResponse);
    });

    it('should handle credential-based connection', async () => {
      mockIntegrationsService.findIntegrationByOrgAndId.mockResolvedValue({
        integration: { id: 1, name: 'jamf' },
      });
      mockIntegrationFactoryService.connectWithCredentials.mockResolvedValue({
        success: true,
        message: 'Connected successfully',
      });

      const result = await controller.connectIntegration(
        mockAuthenticatedRequest as any,
        {
          integration_id: 1,
          connection_type: 'credentials',
          credentials: { username: 'test', password: 'test' },
        },
      );

      expect(result).toEqual({
        success: true,
        message: 'Connected successfully',
      });
    });

    it('should throw BadRequestException for missing integration_id', async () => {
      await expect(
        controller.connectIntegration(mockAuthenticatedRequest as any, {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-existent integration', async () => {
      mockIntegrationsService.findIntegrationByOrgAndId.mockResolvedValue(null);

      await expect(
        controller.connectIntegration(mockAuthenticatedRequest as any, {
          integration_id: 999,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleCallback', () => {
    const mockCallbackResponse = {
      message: 'Integration connected successfully',
      status: 'connected',
    };

    it('should handle callback successfully', async () => {
      mockIntegrationsService.handleCallback.mockResolvedValue(mockCallbackResponse);

      const result = await controller.handleCallback(
        mockAuthenticatedRequest as any,
        {
          code: 'auth-code',
          state: 'state-value',
          integration_id: 1,
        },
      );

      expect(result).toEqual(mockCallbackResponse);
      expect(mockIntegrationsService.handleCallback).toHaveBeenCalledWith(1, {
        code: 'auth-code',
        state: 'state-value',
        integration_id: 1,
      });
    });

    it('should throw BadRequestException when required fields are missing', async () => {
      await expect(
        controller.handleCallback(mockAuthenticatedRequest as any, {
          code: 'auth-code',
          // missing state and integration_id
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException when orgId is null', async () => {
      const requestWithoutOrgId = {
        user: {
          ...mockAuthenticatedRequest.user,
          orgId: null,
        },
      };

      await expect(
        controller.handleCallback(requestWithoutOrgId as any, {
          code: 'auth-code',
          state: 'state-value',
          integration_id: 1,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});