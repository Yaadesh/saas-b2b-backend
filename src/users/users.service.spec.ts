import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;

  const mockUserRepository = {
    find: jest.fn(),
  };

  const mockUsers: User[] = [
    {
      id: 1,
      org_id: 1,
      email: 'john.doe@example.com',
      status: 1,
      created_at: new Date('2024-01-15T00:00:00.000Z'),
      updated_at: new Date('2024-01-15T00:00:00.000Z'),
      organization: {
        id: 1,
        org_name: 'Test Organization',
        org_contact_email: 'admin@example.com',
        created_at: new Date('2024-01-01T00:00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00:00.000Z'),
      } as Organization,
    },
    {
      id: 2,
      org_id: 1,
      email: 'jane.smith@example.com',
      status: 0,
      created_at: new Date('2024-02-20T00:00:00.000Z'),
      updated_at: new Date('2024-02-20T00:00:00.000Z'),
      organization: {
        id: 1,
        org_name: 'Test Organization',
        org_contact_email: 'admin@example.com',
        created_at: new Date('2024-01-01T00:00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00:00.000Z'),
      } as Organization,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUsersByOrgId', () => {
    it('should return formatted users for organization', async () => {
      mockUserRepository.find.mockResolvedValue(mockUsers);

      const result = await service.getUsersByOrgId(1);

      expect(result).toEqual({
        users: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: null,
            team: null,
            status: 1,
            lastLogin: null,
            joinDate: '2024-01-15',
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            role: null,
            team: null,
            status: 0,
            lastLogin: null,
            joinDate: '2024-02-20',
          },
        ],
        total: 2,
      });

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { org_id: 1 },
        relations: ['organization'],
      });
    });

    it('should handle users with complex email formats', async () => {
      const complexEmailUser: User = {
        id: 3,
        org_id: 1,
        email: 'test.user_name@example.co.uk',
        status: 1,
        created_at: new Date('2024-01-15T00:00:00.000Z'),
        updated_at: new Date('2024-01-15T00:00:00.000Z'),
        organization: mockUsers[0].organization,
      };

      mockUserRepository.find.mockResolvedValue([complexEmailUser]);

      const result = await service.getUsersByOrgId(1);

      expect(result.users[0].name).toBe('Test User Name');
    });

    it('should return empty array when no users found', async () => {
      mockUserRepository.find.mockResolvedValue([]);

      const result = await service.getUsersByOrgId(1);

      expect(result).toEqual({
        users: [],
        total: 0,
      });
    });

    it('should handle repository errors', async () => {
      mockUserRepository.find.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getUsersByOrgId(1)).rejects.toThrow('Database connection failed');
    });

    it('should format join date correctly', async () => {
      const userWithSpecificDate: User = {
        id: 4,
        org_id: 1,
        email: 'date.test@example.com',
        status: 1,
        created_at: new Date('2024-03-15T14:30:45.123Z'),
        updated_at: new Date('2024-03-15T14:30:45.123Z'),
        organization: mockUsers[0].organization,
      };

      mockUserRepository.find.mockResolvedValue([userWithSpecificDate]);

      const result = await service.getUsersByOrgId(1);

      expect(result.users[0].joinDate).toBe('2024-03-15');
    });
  });
});