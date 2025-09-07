import { Test, TestingModule } from '@nestjs/testing';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { User } from '../users/entities/user.entity';

describe('ModulesController', () => {
  let controller: ModulesController;
  let modulesService: ModulesService;

  const mockModulesService = {
    createModule: jest.fn(),
    getModules: jest.fn(),
    searchModules: jest.fn(),
    searchConfluenceDocuments: jest.fn(),
    getRecentConfluenceDocuments: jest.fn(),
    getConfluenceSpaces: jest.fn(),
    getModuleById: jest.fn(),
    updateModule: jest.fn(),
    deleteModule: jest.fn(),
  };

  const mockUser: User = {
    id: 1,
    org_id: 1,
    email: 'test@example.com',
    status: 1,
    created_at: new Date(),
    updated_at: new Date(),
    organization: undefined,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModulesController],
      providers: [
        {
          provide: ModulesService,
          useValue: mockModulesService,
        },
      ],
    }).compile();

    controller = module.get<ModulesController>(ModulesController);
    modulesService = module.get<ModulesService>(ModulesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createModule', () => {
    const createModuleDto = {
      name: 'Test Module',
      docs: [{ url: 'https://example.com/doc1' }],
      tasks: [{ text: 'Complete task 1' }],
    };

    const expectedResponse = {
      id: 1,
      name: 'Test Module',
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should create module successfully', async () => {
      mockModulesService.createModule.mockResolvedValue(expectedResponse);

      const result = await controller.createModule(mockUser, createModuleDto);

      expect(result).toEqual(expectedResponse);
      expect(mockModulesService.createModule).toHaveBeenCalledWith(
        1,
        1,
        createModuleDto,
      );
    });

    it('should handle service errors', async () => {
      mockModulesService.createModule.mockRejectedValue(
        new Error('Failed to create module'),
      );

      await expect(
        controller.createModule(mockUser, createModuleDto),
      ).rejects.toThrow('Failed to create module');
    });
  });

  describe('getModules', () => {
    const expectedResponse = {
      modules: [
        {
          id: 1,
          name: 'Module 1',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          name: 'Module 2',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      total: 2,
    };

    it('should get modules successfully', async () => {
      mockModulesService.getModules.mockResolvedValue(expectedResponse);

      const result = await controller.getModules(mockUser);

      expect(result).toEqual(expectedResponse);
      expect(mockModulesService.getModules).toHaveBeenCalledWith(1, undefined);
    });

    it('should get modules with includeInactive flag', async () => {
      mockModulesService.getModules.mockResolvedValue(expectedResponse);

      const result = await controller.getModules(mockUser, true);

      expect(result).toEqual(expectedResponse);
      expect(mockModulesService.getModules).toHaveBeenCalledWith(1, true);
    });
  });

  describe('searchModules', () => {
    const expectedResponse = {
      modules: [
        {
          id: 1,
          name: 'Searched Module',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      total: 1,
    };

    it('should search modules successfully', async () => {
      mockModulesService.searchModules.mockResolvedValue(expectedResponse);

      const result = await controller.searchModules(mockUser, 'test');

      expect(result).toEqual(expectedResponse);
      expect(mockModulesService.searchModules).toHaveBeenCalledWith(1, 'test');
    });
  });

  describe('searchDocuments', () => {
    const expectedResponse = {
      documents: [
        {
          id: 'doc1',
          title: 'Test Document',
          url: 'https://confluence.example.com/doc1',
          space: 'Engineering',
        },
      ],
      total: 1,
    };

    it('should search documents successfully', async () => {
      mockModulesService.searchConfluenceDocuments.mockResolvedValue(expectedResponse);

      const result = await controller.searchDocuments(mockUser, 1, 'test', 10);

      expect(result).toEqual(expectedResponse);
      expect(mockModulesService.searchConfluenceDocuments).toHaveBeenCalledWith(
        1,
        1,
        'test',
        10,
      );
    });

    it('should handle search without limit', async () => {
      mockModulesService.searchConfluenceDocuments.mockResolvedValue(expectedResponse);

      await controller.searchDocuments(mockUser, 1, 'test');

      expect(mockModulesService.searchConfluenceDocuments).toHaveBeenCalledWith(
        1,
        1,
        'test',
        undefined,
      );
    });
  });

  describe('getRecentDocuments', () => {
    const expectedResponse = {
      documents: [
        {
          id: 'doc1',
          title: 'Recent Document',
          url: 'https://confluence.example.com/doc1',
          created_at: new Date(),
        },
      ],
      total: 1,
    };

    it('should get recent documents successfully', async () => {
      mockModulesService.getRecentConfluenceDocuments.mockResolvedValue(
        expectedResponse,
      );

      const result = await controller.getRecentDocuments(mockUser, 1, 5);

      expect(result).toEqual(expectedResponse);
      expect(mockModulesService.getRecentConfluenceDocuments).toHaveBeenCalledWith(
        1,
        1,
        5,
      );
    });

    it('should handle without limit', async () => {
      mockModulesService.getRecentConfluenceDocuments.mockResolvedValue(
        expectedResponse,
      );

      await controller.getRecentDocuments(mockUser, 1);

      expect(mockModulesService.getRecentConfluenceDocuments).toHaveBeenCalledWith(
        1,
        1,
        undefined,
      );
    });
  });

  describe('getDocumentSpaces', () => {
    const expectedResponse = {
      spaces: [
        {
          id: 'space1',
          key: 'ENG',
          name: 'Engineering',
        },
      ],
    };

    it('should get document spaces successfully', async () => {
      mockModulesService.getConfluenceSpaces.mockResolvedValue(expectedResponse);

      const result = await controller.getDocumentSpaces(mockUser, 1, 10);

      expect(result).toEqual(expectedResponse);
      expect(mockModulesService.getConfluenceSpaces).toHaveBeenCalledWith(
        1,
        1,
        10,
      );
    });
  });

  describe('getModuleById', () => {
    const expectedResponse = {
      id: 1,
      name: 'Test Module',
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should get module by id successfully', async () => {
      mockModulesService.getModuleById.mockResolvedValue(expectedResponse);

      const result = await controller.getModuleById(mockUser, 1);

      expect(result).toEqual(expectedResponse);
      expect(mockModulesService.getModuleById).toHaveBeenCalledWith(1, 1);
    });

    it('should handle module not found', async () => {
      mockModulesService.getModuleById.mockRejectedValue(
        new Error('Module not found'),
      );

      await expect(controller.getModuleById(mockUser, 999)).rejects.toThrow(
        'Module not found',
      );
    });
  });

  describe('updateModule', () => {
    const updateModuleDto = {
      name: 'Updated Module',
    };

    const expectedResponse = {
      id: 1,
      name: 'Updated Module',
      updated_at: new Date(),
    };

    it('should update module successfully', async () => {
      mockModulesService.updateModule.mockResolvedValue(expectedResponse);

      const result = await controller.updateModule(mockUser, 1, updateModuleDto);

      expect(result).toEqual(expectedResponse);
      expect(mockModulesService.updateModule).toHaveBeenCalledWith(
        1,
        1,
        updateModuleDto,
      );
    });

    it('should handle update errors', async () => {
      mockModulesService.updateModule.mockRejectedValue(
        new Error('Failed to update module'),
      );

      await expect(
        controller.updateModule(mockUser, 1, updateModuleDto),
      ).rejects.toThrow('Failed to update module');
    });
  });

  describe('deleteModule', () => {
    it('should delete module successfully', async () => {
      mockModulesService.deleteModule.mockResolvedValue(undefined);

      await controller.deleteModule(mockUser, 1);

      expect(mockModulesService.deleteModule).toHaveBeenCalledWith(1, 1);
    });

    it('should handle delete errors', async () => {
      mockModulesService.deleteModule.mockRejectedValue(
        new Error('Failed to delete module'),
      );

      await expect(controller.deleteModule(mockUser, 1)).rejects.toThrow(
        'Failed to delete module',
      );
    });
  });
});