export interface SupabaseJwtPayload {
  aud?: string;
  exp?: number;
  sub: string;
  email?: string;
  role?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  [claim: string]: unknown;
}

export interface SupabaseAuthUser {
  id: string;
  email?: string;
  role?: string;
  aud?: string;
  appMetadata?: Record<string, unknown>;
  userMetadata?: Record<string, unknown>;
  rawClaims: SupabaseJwtPayload;
}
