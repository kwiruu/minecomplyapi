import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  GLOBAL_PREFIX: Joi.string().default('api'),
  CORS_ORIGINS: Joi.string().optional(),
  APP_NAME: Joi.string().optional(),
  APP_DESCRIPTION: Joi.string().optional(),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  DIRECT_DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .optional(),
  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_ANON_KEY: Joi.string().required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().allow('', null),
  SUPABASE_JWKS_URL: Joi.string().uri().required(),
  SUPABASE_JWT_SECRET: Joi.string().allow('', null),
  SUPABASE_STORAGE_BUCKET: Joi.string().required(),
  SUPABASE_STORAGE_UPLOADS_PATH: Joi.string().default('uploads/'),
});
