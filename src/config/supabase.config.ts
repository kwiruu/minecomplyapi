export default () => ({
  supabase: {
    url: process.env.SUPABASE_URL ?? '',
    anonKey: process.env.SUPABASE_ANON_KEY ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    jwksUrl: process.env.SUPABASE_JWKS_URL ?? '',
    jwtSecret: process.env.SUPABASE_JWT_SECRET ?? '',
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? '',
    storageUploadsPath: process.env.SUPABASE_STORAGE_UPLOADS_PATH ?? 'uploads/',
  },
});
