import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { QueryBus } from '@nestjs/cqrs';
import { GetUserByEmailQuery } from '../users/queries/get-user-by-email.query';

export interface JwtPayload {
  sub: string;
  email: string;
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  role?: string;
  session_id?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private jwks: ReturnType<typeof createRemoteJWKSet>;
  private expectedIssuer: string;

  constructor(
    private configService: ConfigService,
    private queryBus: QueryBus,
  ) {
    super();

    const supabaseUrl = configService.get<string>('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is required');
    }

    this.expectedIssuer = `${supabaseUrl}/auth/v1`;
    this.jwks = createRemoteJWKSet(
      new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
    );
  }

  async validate(req: Request) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No valid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        audience: 'authenticated',
        issuer: this.expectedIssuer,
      });

      const user = await this.queryBus.execute(
        new GetUserByEmailQuery(payload.email as string),
      );

      return {
        userId: payload.sub as string,
        email: payload.email as string,
        orgId: user?.org_id || null,
        payload: payload,
        user: user,
      };
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
