import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QueryBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { jwtVerify } from 'jose';
import { JwtStrategy } from './jwt.strategy';

jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  createRemoteJWKSet: jest.fn().mockReturnValue(jest.fn()),
}));

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('https://project.supabase.co'),
  };

  const mockQueryBus = {
    execute: jest.fn(),
  };

  const buildRequest = (authorization?: string): Request =>
    ({ headers: { authorization } }) as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: QueryBus, useValue: mockQueryBus },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws when SUPABASE_URL is not configured', async () => {
    const badConfigService = { get: jest.fn().mockReturnValue(undefined) };
    expect(
      () =>
        new JwtStrategy(
          badConfigService as unknown as ConfigService,
          mockQueryBus as unknown as QueryBus,
        ),
    ).toThrow('SUPABASE_URL is required');
  });

  it('rejects a request with no authorization header', async () => {
    await expect(strategy.validate(buildRequest())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a request with a non-Bearer authorization header', async () => {
    await expect(
      strategy.validate(buildRequest('Basic abc123')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a token that fails JWKS verification', async () => {
    (jwtVerify as jest.Mock).mockRejectedValue(new Error('bad signature'));

    await expect(
      strategy.validate(buildRequest('Bearer bad.token.value')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('resolves the authenticated user for a valid token', async () => {
    (jwtVerify as jest.Mock).mockResolvedValue({
      payload: { sub: 'user-123', email: 'jane@example.com' },
    });
    mockQueryBus.execute.mockResolvedValue({ id: 1, org_id: 10 });

    const result = await strategy.validate(buildRequest('Bearer good.token'));

    expect(result).toEqual({
      userId: 'user-123',
      email: 'jane@example.com',
      orgId: 10,
      payload: { sub: 'user-123', email: 'jane@example.com' },
      user: { id: 1, org_id: 10 },
    });
  });

  it('falls back to a null orgId when no local user record exists', async () => {
    (jwtVerify as jest.Mock).mockResolvedValue({
      payload: { sub: 'user-123', email: 'unknown@example.com' },
    });
    mockQueryBus.execute.mockResolvedValue(null);

    const result = await strategy.validate(
      buildRequest('Bearer good.token'),
    );

    expect(result.orgId).toBeNull();
  });
});
