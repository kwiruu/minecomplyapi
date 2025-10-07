import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as JwtStrategy } from 'passport-jwt';
import type { JwtFromRequestFunction, SecretOrKeyProvider } from 'passport-jwt';
import jwksRsa from 'jwks-rsa';
import {
  SupabaseAuthUser,
  SupabaseJwtPayload,
} from '../interfaces/supabase-user.interface';
import { setAuthToken } from '../token-store';

type JwksClient = ReturnType<typeof jwksRsa>;

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy<
  typeof JwtStrategy,
  SupabaseAuthUser
>(JwtStrategy, 'supabase-jwt') {
  constructor(private readonly configService: ConfigService) {
    const {
      url: supabaseUrl,
      jwksUrl,
      jwtSecret,
    } = configService.getOrThrow<{
      url: string;
      jwksUrl: string;
      jwtSecret?: string;
    }>('supabase');

    const jwksClient = jwksRsa({
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 300000,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: jwksUrl,
    });

    const secretOrKeyProvider = createHybridSecretOrKeyProvider(
      jwksClient,
      jwtSecret,
    );
    const jwtFromRequest = createJwtFromRequestExtractor();

    super({
      secretOrKeyProvider,
      jwtFromRequest,
      audience: 'authenticated',
      // Accept both issuer formats to handle service role and user tokens
      issuer: [
        'supabase', // Service role tokens
        new URL('/auth/v1', supabaseUrl).toString(), // User tokens
      ],
      ignoreExpiration: false,
      algorithms: ['HS256', 'RS256'], // Support both, HS256 is primary for Supabase
    });
  }

  validate(payload: SupabaseJwtPayload): SupabaseAuthUser {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid Supabase access token');
    }

    return {
      id: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      role: typeof payload.role === 'string' ? payload.role : undefined,
      aud: payload.aud,
      appMetadata:
        payload.app_metadata && typeof payload.app_metadata === 'object'
          ? payload.app_metadata
          : undefined,
      userMetadata:
        payload.user_metadata && typeof payload.user_metadata === 'object'
          ? payload.user_metadata
          : undefined,
      rawClaims: payload,
    };
  }
}

const createHybridSecretOrKeyProvider = (
  client: JwksClient,
  rawJwtSecret?: string,
): SecretOrKeyProvider<unknown> => {
  const resolvedSecret = resolveHsSecret(rawJwtSecret);
  return (_request, rawJwtToken, done) => {
    void (async () => {
      try {
        if (typeof rawJwtToken !== 'string') {
          throw new Error('JWT token must be a string');
        }

        const header = extractHeader(rawJwtToken);
        const alg = header?.alg;

        if (alg === 'HS256') {
          if (!resolvedSecret) {
            throw new Error(
              'HS256 token received but SUPABASE_JWT_SECRET is not configured',
            );
          }
          return done(null, resolvedSecret);
        }

        const kid = header?.kid;
        if (!kid) {
          throw new Error('JWT header does not contain a key id (kid)');
        }

        const signingKey = await client.getSigningKey(kid);
        const publicKey = extractPublicKey(signingKey);

        if (!publicKey) {
          throw new Error(`Unable to resolve signing key for kid ${kid}`);
        }

        done(null, publicKey);
      } catch (error) {
        done(asError(error));
      }
    })();
  };
};

const createJwtFromRequestExtractor = (): JwtFromRequestFunction<unknown> => {
  return (request) => {
    if (!request || typeof request !== 'object') {
      return null;
    }

    const headers = (request as { headers?: unknown }).headers;
    if (!headers || typeof headers !== 'object') {
      return null;
    }

    const authorization = resolveHeaderValue(
      headers as Record<string, unknown>,
      'authorization',
    );

    if (typeof authorization !== 'string') {
      return null;
    }

    const [scheme, token] = authorization.trim().split(/\s+/);

    if (!token || scheme.toLowerCase() !== 'bearer') {
      return null;
    }

    setAuthToken(token);

    return token;
  };
};

const resolveHeaderValue = (
  headers: Record<string, unknown>,
  name: string,
): unknown => {
  const directValue = headers[name];
  if (typeof directValue === 'string') {
    return directValue;
  }

  if (Array.isArray(directValue)) {
    const firstString = directValue.find((entry) => typeof entry === 'string');
    if (firstString) {
      return firstString;
    }
  }

  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName) {
      if (typeof value === 'string') {
        return value;
      }

      if (Array.isArray(value)) {
        const firstString = value.find((entry) => typeof entry === 'string');
        if (firstString) {
          return firstString;
        }
      }
    }
  }

  return undefined;
};

const extractHeader = (
  token: string,
): { kid?: string; alg?: string } | undefined => {
  const dotIndex = token.indexOf('.');
  if (dotIndex <= 0) return undefined;
  const encodedHeader = token.slice(0, dotIndex);
  const decodedHeader = decodeBase64Url(encodedHeader);
  try {
    const h = JSON.parse(decodedHeader) as unknown;
    if (!h || typeof h !== 'object') return undefined;
    const rec = h as Record<string, unknown>;
    const kid = typeof rec.kid === 'string' ? rec.kid : undefined;
    const alg = typeof rec.alg === 'string' ? rec.alg : undefined;
    return { kid, alg };
  } catch {
    return undefined;
  }
};

const decodeBase64Url = (segment: string): string => {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = normalized.length % 4;
  const padded =
    paddingLength === 0
      ? normalized
      : normalized.padEnd(normalized.length + (4 - paddingLength), '=');

  return Buffer.from(padded, 'base64').toString('utf8');
};

const decodeBase64UrlToBuffer = (segment: string): Buffer => {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = normalized.length % 4;
  const padded =
    paddingLength === 0
      ? normalized
      : normalized.padEnd(normalized.length + (4 - paddingLength), '=');
  return Buffer.from(padded, 'base64');
};

const resolveHsSecret = (value?: string): string | Buffer | undefined => {
  if (!value || value.trim().length === 0) return undefined;
  // Supabase often prefixes HS256 secrets with sb_secret_ and base64url encodes the remainder
  if (value.startsWith('sb_secret_')) {
    if (process.env.SUPABASE_JWT_SECRET_RAW === 'true') {
      return value;
    }
    const b64u = value.substring('sb_secret_'.length);
    try {
      // Return the raw bytes Buffer; HMAC verification expects bytes, not UTF-8 string
      return decodeBase64UrlToBuffer(b64u);
    } catch {
      // Fall back to raw value if decoding fails
      return value;
    }
  }
  return value;
};

const extractPublicKey = (signingKey: unknown): string | undefined => {
  if (
    signingKey &&
    typeof signingKey === 'object' &&
    'getPublicKey' in signingKey &&
    typeof (signingKey as { getPublicKey: unknown }).getPublicKey === 'function'
  ) {
    return (signingKey as { getPublicKey: () => string }).getPublicKey();
  }

  if (
    signingKey &&
    typeof signingKey === 'object' &&
    'publicKey' in signingKey &&
    typeof (signingKey as { publicKey: unknown }).publicKey === 'string'
  ) {
    return (signingKey as { publicKey: string }).publicKey;
  }

  if (
    signingKey &&
    typeof signingKey === 'object' &&
    'rsaPublicKey' in signingKey &&
    typeof (signingKey as { rsaPublicKey: unknown }).rsaPublicKey === 'string'
  ) {
    return (signingKey as { rsaPublicKey: string }).rsaPublicKey;
  }

  return undefined;
};

const asError = (candidate: unknown): Error => {
  if (candidate instanceof Error) {
    return candidate;
  }

  return new Error(
    typeof candidate === 'string'
      ? candidate
      : 'Unable to resolve Supabase signing key',
  );
};
