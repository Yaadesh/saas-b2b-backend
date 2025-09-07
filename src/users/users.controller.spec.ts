import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { GetUsersResponseDto } from './dto/get-users-response.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    getUsersByOrgId: jest.fn(),
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

  const mockUsersResponse: GetUsersResponseDto = {
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
        status: 1,
        lastLogin: null,
        joinDate: '2024-02-20',
      },
    ],
    total: 2,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsers', () => {
    it('should return users for valid organization', async () => {
      mockUsersService.getUsersByOrgId.mockResolvedValue(mockUsersResponse);

      const result = await controller.getUsers(mockAuthenticatedRequest as any);

      expect(result).toEqual(mockUsersResponse);
      expect(mockUsersService.getUsersByOrgId).toHaveBeenCalledWith(1);
      expect(mockUsersService.getUsersByOrgId).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when orgId is null', async () => {
      const requestWithoutOrgId = {
        user: {
          ...mockAuthenticatedRequest.user,
          orgId: null,
        },
      };

      await expect(
        controller.getUsers(requestWithoutOrgId as any),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUsersService.getUsersByOrgId).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when orgId is undefined', async () => {
      const requestWithoutOrgId = {
        user: {
          ...mockAuthenticatedRequest.user,
          orgId: undefined,
        },
      };

      await expect(
        controller.getUsers(requestWithoutOrgId as any),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUsersService.getUsersByOrgId).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockUsersService.getUsersByOrgId.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        controller.getUsers(mockAuthenticatedRequest as any),
      ).rejects.toThrow('Database error');

      expect(mockUsersService.getUsersByOrgId).toHaveBeenCalledWith(1);
    });
  });
});