const parseCorsOrigins = (value?: string): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export default () => {
  const defaultOrigins = ['http://localhost:3000', 'http://localhost:19006'];

  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);

  return {
    app: {
      name: process.env.APP_NAME ?? 'MineComply API',
      description:
        process.env.APP_DESCRIPTION ?? 'MineComply compliance management API',
      version: process.env.npm_package_version ?? '0.1.0',
      environment: process.env.NODE_ENV ?? 'development',
      port: parseInt(process.env.PORT ?? '3000', 10),
      globalPrefix: process.env.GLOBAL_PREFIX ?? 'api',
      corsOrigins: corsOrigins.length ? corsOrigins : defaultOrigins,
    },
  };
};
