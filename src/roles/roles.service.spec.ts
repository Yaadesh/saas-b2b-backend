import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { RoleIntegrationMapping } from './entities/role-integration-mapping.entity';
import { UserRoleMapping } from './entities/user-role-mapping.entity';
import { RoleModuleMapping } from './entities/role-module-mapping.entity';

describe('RolesService', () => {
  let service: RolesService;

  const mockRole: Role = {
    id: 1,
    org_id: 10,
    role_type_id: 1,
    team_name: 'Backend',
    title: 'Engineer',
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    updated_at: new Date('2024-01-01T00:00:00.000Z'),
  } as Role;

  const mockRoleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRoleIntegrationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
  };

  const mockUserRoleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  };

  const mockRoleModuleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getRepositoryToken(Role), useValue: mockRoleRepository },
        {
          provide: getRepositoryToken(RoleIntegrationMapping),
          useValue: mockRoleIntegrationRepository,
        },
        {
          provide: getRepositoryToken(UserRoleMapping),
          useValue: mockUserRoleRepository,
        },
        {
          provide: getRepositoryToken(RoleModuleMapping),
          useValue: mockRoleModuleRepository,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a role with no integrations or modules', async () => {
      mockRoleRepository.create.mockReturnValue(mockRole);
      mockRoleRepository.save.mockResolvedValue(mockRole);

      const result = await service.create({
        org_id: 10,
        role_type_id: 1,
        title: 'Engineer',
      });

      expect(result).toEqual(mockRole);
      expect(mockRoleIntegrationRepository.save).not.toHaveBeenCalled();
      expect(mockRoleModuleRepository.save).not.toHaveBeenCalled();
    });

    it('creates the role-integration and role-module mappings when provided', async () => {
      mockRoleRepository.create.mockReturnValue(mockRole);
      mockRoleRepository.save.mockResolvedValue(mockRole);
      mockRoleIntegrationRepository.create.mockImplementation((data) => data);
      mockRoleIntegrationRepository.save.mockResolvedValue({});
      mockRoleModuleRepository.create.mockImplementation((data) => data);
      mockRoleModuleRepository.save.mockResolvedValue({});

      await service.create({
        org_id: 10,
        role_type_id: 1,
        title: 'Engineer',
        integrations: [{ integration_id: 5, meta_data: { foo: 'bar' } }],
        modules: [7, 8],
      });

      expect(mockRoleIntegrationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          role_id: mockRole.id,
          integration_id: 5,
          org_id: mockRole.org_id,
          meta_data: { foo: 'bar' },
        }),
      );
      expect(mockRoleModuleRepository.save).toHaveBeenCalledTimes(2);
    });

    it('throws ConflictException when the title already exists in the org', async () => {
      mockRoleRepository.create.mockReturnValue(mockRole);
      mockRoleRepository.save.mockRejectedValue({
        code: '23505',
        constraint: 'unique_role_title_per_org',
      });

      await expect(
        service.create({ org_id: 10, role_type_id: 1, title: 'Engineer' }),
      ).rejects.toThrow(ConflictException);
    });

    it('rethrows unrelated errors', async () => {
      mockRoleRepository.create.mockReturnValue(mockRole);
      mockRoleRepository.save.mockRejectedValue(new Error('connection lost'));

      await expect(
        service.create({ org_id: 10, role_type_id: 1, title: 'Engineer' }),
      ).rejects.toThrow('connection lost');
    });
  });

  describe('findAll', () => {
    it('scopes the query to the org and maps joined integrations', async () => {
      const queryBuilderMock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            ...mockRole,
            roleIntegrations: [
              {
                integration_id: 5,
                meta_data: { foo: 'bar' },
                integration: {
                  name: 'slack',
                  meta_data: {
                    img_url: 'img',
                    subtext: 'sub',
                    display_name: 'Slack',
                  },
                },
              },
            ],
          },
        ]),
      };
      mockRoleRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

      const result = await service.findAll(10);

      expect(queryBuilderMock.where).toHaveBeenCalledWith(
        'role.org_id = :orgId',
        { orgId: 10 },
      );
      expect(result).toHaveLength(1);
      expect(result[0].integrations).toEqual([
        {
          integration_id: 5,
          integration_name: 'slack',
          meta_data: { foo: 'bar' },
          img_url: 'img',
          subtext: 'sub',
          display_name: 'Slack',
        },
      ]);
    });

    it('returns an empty integrations array when a role has none', async () => {
      const queryBuilderMock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([{ ...mockRole, roleIntegrations: [] }]),
      };
      mockRoleRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

      const result = await service.findAll(10);

      expect(result[0].integrations).toEqual([]);
    });
  });

  describe('update', () => {
    it('returns the updated role', async () => {
      mockRoleRepository.update.mockResolvedValue({ affected: 1 });
      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.update(1, 10, { title: 'New Title' });

      expect(result).toEqual(mockRole);
      expect(mockRoleRepository.update).toHaveBeenCalledWith(
        { id: 1, org_id: 10 },
        { title: 'New Title' },
      );
    });

    it('throws NotFoundException when the role does not exist for the org', async () => {
      mockRoleRepository.update.mockResolvedValue({ affected: 0 });
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, 10, { title: 'New Title' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignUserToRole', () => {
    it('reactivates an existing mapping instead of creating a duplicate', async () => {
      const existing = { user_id: 1, role_id: 2, org_id: 10, status: 0 };
      mockUserRoleRepository.findOne.mockResolvedValue(existing);
      mockUserRoleRepository.save.mockImplementation((m) => m);

      const result = await service.assignUserToRole({
        user_id: 1,
        role_id: 2,
        org_id: 10,
      });

      expect(result.status).toBe(1);
      expect(mockUserRoleRepository.create).not.toHaveBeenCalled();
    });

    it('creates a new mapping when none exists', async () => {
      mockUserRoleRepository.findOne.mockResolvedValue(null);
      mockUserRoleRepository.create.mockImplementation((m) => m);
      mockUserRoleRepository.save.mockImplementation((m) => m);

      const result = await service.assignUserToRole({
        user_id: 1,
        role_id: 2,
        org_id: 10,
      });

      expect(result).toEqual(
        expect.objectContaining({ user_id: 1, role_id: 2, status: 1 }),
      );
    });
  });

  describe('assignModuleToRole', () => {
    it('is idempotent when the mapping already exists', async () => {
      const existing = { role_id: 2, module_id: 3, org_id: 10 };
      mockRoleModuleRepository.findOne.mockResolvedValue(existing);

      const result = await service.assignModuleToRole({
        role_id: 2,
        module_id: 3,
        org_id: 10,
      });

      expect(result).toBe(existing);
      expect(mockRoleModuleRepository.save).not.toHaveBeenCalled();
    });
  });
});
