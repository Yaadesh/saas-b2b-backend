import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { IntegrationRepository } from './integration.repository';
import { Integration } from '../entities/integration.entity';
import { OrgIntegrationMapping } from '../entities/org-integration.entity';

describe('IntegrationRepository', () => {
  let repository: IntegrationRepository;
  let integrationRepository: Repository<Integration>;
  let orgIntegrationMappingRepository: Repository<OrgIntegrationMapping>;

  const mockSelectQueryBuilder = {
    createQueryBuilder: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const mockIntegrationRepository = {
    createQueryBuilder: jest.fn(() => mockSelectQueryBuilder),
    findOne: jest.fn(),
  };

  const mockOrgIntegrationMappingRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockIntegrationsData = [
    {
      id: 1,
      name: 'okta',
      is_enabled: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
      meta_data: { display_name: 'Okta' },
      integration_type: 1,
      org_integration_status: null,
    },
    {
      id: 2,
      name: 'confluence',
      is_enabled: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
      meta_data: { display_name: 'Confluence' },
      integration_type: 1,
      org_integration_status: 1,
    },
    {
      id: 3,
      name: 'slack-app',
      is_enabled: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
      meta_data: { display_name: 'Slack App' },
      integration_type: 2,
      org_integration_status: null,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationRepository,
        {
          provide: getRepositoryToken(Integration),
          useValue: mockIntegrationRepository,
        },
        {
          provide: getRepositoryToken(OrgIntegrationMapping),
          useValue: mockOrgIntegrationMappingRepository,
        },
      ],
    }).compile();

    repository = module.get<IntegrationRepository>(IntegrationRepository);
    integrationRepository = module.get<Repository<Integration>>(
      getRepositoryToken(Integration),
    );
    orgIntegrationMappingRepository = module.get<Repository<OrgIntegrationMapping>>(
      getRepositoryToken(OrgIntegrationMapping),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findIntegrationsByOrgId', () => {
    it('should return all integrations without type filter', async () => {
      mockSelectQueryBuilder.getRawMany.mockResolvedValue(mockIntegrationsData);

      const result = await repository.findIntegrationsByOrgId(1);

      expect(result).toEqual(mockIntegrationsData);
      expect(mockIntegrationRepository.createQueryBuilder).toHaveBeenCalledWith('integration');
      expect(mockSelectQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'org_integration_mapping',
        'org_mapping',
        'org_mapping.integration_id = integration.id AND org_mapping.org_id = :orgId',
        { orgId: 1 },
      );
      expect(mockSelectQueryBuilder.where).toHaveBeenCalledWith(
        'integration.is_enabled = :enabled',
        { enabled: true },
      );
      expect(mockSelectQueryBuilder.andWhere).not.toHaveBeenCalled();
      expect(mockSelectQueryBuilder.orderBy).toHaveBeenCalledWith(
        'integration.created_at',
        'ASC',
      );
    });

    it('should filter integrations by type when specified', async () => {
      const functionalIntegrations = mockIntegrationsData.filter(
        (integration) => integration.integration_type === 1,
      );
      mockSelectQueryBuilder.getRawMany.mockResolvedValue(functionalIntegrations);

      const result = await repository.findIntegrationsByOrgId(1, 1);

      expect(result).toEqual(functionalIntegrations);
      expect(mockSelectQueryBuilder.andWhere).toHaveBeenCalledWith(
        'integration.integration_type = :integrationType',
        { integrationType: 1 },
      );
    });

    it('should filter integrations by app type', async () => {
      const appIntegrations = mockIntegrationsData.filter(
        (integration) => integration.integration_type === 2,
      );
      mockSelectQueryBuilder.getRawMany.mockResolvedValue(appIntegrations);

      const result = await repository.findIntegrationsByOrgId(1, 2);

      expect(result).toEqual(appIntegrations);
      expect(mockSelectQueryBuilder.andWhere).toHaveBeenCalledWith(
        'integration.integration_type = :integrationType',
        { integrationType: 2 },
      );
    });

    it('should handle empty results', async () => {
      mockSelectQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await repository.findIntegrationsByOrgId(1, 999);

      expect(result).toEqual([]);
    });

    it('should include all required fields in select', async () => {
      await repository.findIntegrationsByOrgId(1);

      expect(mockSelectQueryBuilder.select).toHaveBeenCalledWith([
        'integration.id as id',
        'integration.name as name',
        'integration.is_enabled as is_enabled',
        'integration.created_at as created_at',
        'integration.updated_at as updated_at',
        'integration.meta_data as meta_data',
        'integration.integration_type as integration_type',
        'org_mapping.status as org_integration_status',
      ]);
    });

    it('should handle database errors', async () => {
      mockSelectQueryBuilder.getRawMany.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(repository.findIntegrationsByOrgId(1)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('findIntegrationByOrgAndId', () => {
    const mockIntegration: Integration = {
      id: 1,
      name: 'okta',
      is_enabled: true,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      updated_at: new Date('2024-01-01T00:00:00.000Z'),
      meta_data: { display_name: 'Okta' },
      integration_type: 1,
      integrationType: undefined,
    };

    const mockMapping: OrgIntegrationMapping = {
      org_id: 1,
      integration_id: 1,
      status: 1,
    } as OrgIntegrationMapping;

    it('should return integration with mapping status', async () => {
      mockIntegrationRepository.findOne.mockResolvedValue(mockIntegration);
      mockOrgIntegrationMappingRepository.findOne.mockResolvedValue(mockMapping);

      const result = await repository.findIntegrationByOrgAndId(1, 1);

      expect(result).toEqual({
        id: 1,
        name: 'okta',
        is_enabled: true,
        created_at: mockIntegration.created_at,
        updated_at: mockIntegration.updated_at,
        meta_data: { display_name: 'Okta' },
        org_integration_status: 1,
      });

      expect(mockIntegrationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, is_enabled: true },
      });
      expect(mockOrgIntegrationMappingRepository.findOne).toHaveBeenCalledWith({
        where: { org_id: 1, integration_id: 1 },
      });
    });

    it('should return integration without mapping status when no mapping exists', async () => {
      mockIntegrationRepository.findOne.mockResolvedValue(mockIntegration);
      mockOrgIntegrationMappingRepository.findOne.mockResolvedValue(null);

      const result = await repository.findIntegrationByOrgAndId(1, 1);

      expect(result).toEqual({
        id: 1,
        name: 'okta',
        is_enabled: true,
        created_at: mockIntegration.created_at,
        updated_at: mockIntegration.updated_at,
        meta_data: { display_name: 'Okta' },
        org_integration_status: null,
      });
    });

    it('should return null when integration not found', async () => {
      mockIntegrationRepository.findOne.mockResolvedValue(null);

      const result = await repository.findIntegrationByOrgAndId(1, 999);

      expect(result).toBeNull();
      expect(mockOrgIntegrationMappingRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return null when integration is disabled', async () => {
      mockIntegrationRepository.findOne.mockResolvedValue(null);

      const result = await repository.findIntegrationByOrgAndId(1, 1);

      expect(result).toBeNull();
    });
  });

  describe('findOrgIntegrationMapping', () => {
    it('should find existing mapping', async () => {
      const mockMapping = { org_id: 1, integration_id: 1, status: 1 };
      mockOrgIntegrationMappingRepository.findOne.mockResolvedValue(mockMapping);

      const result = await repository.findOrgIntegrationMapping(1, 1);

      expect(result).toEqual(mockMapping);
      expect(mockOrgIntegrationMappingRepository.findOne).toHaveBeenCalledWith({
        where: { org_id: 1, integration_id: 1 },
      });
    });

    it('should return null when mapping not found', async () => {
      mockOrgIntegrationMappingRepository.findOne.mockResolvedValue(null);

      const result = await repository.findOrgIntegrationMapping(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('findIntegrationByName', () => {
    it('should find integration by name (case insensitive)', async () => {
      const mockIntegration = { id: 1, name: 'okta', is_enabled: true };
      mockIntegrationRepository.findOne.mockResolvedValue(mockIntegration);

      const result = await repository.findIntegrationByName('OKTA');

      expect(result).toEqual(mockIntegration);
      expect(mockIntegrationRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'okta', is_enabled: true },
      });
    });

    it('should return null when integration not found', async () => {
      mockIntegrationRepository.findOne.mockResolvedValue(null);

      const result = await repository.findIntegrationByName('nonexistent');

      expect(result).toBeNull();
    });
  });
});