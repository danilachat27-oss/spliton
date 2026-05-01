export default () => ({
  app: {
    serviceName: 'spliton-backend',
    port: Number(process.env.PORT ?? 4000),
    frontendOrigin:
      process.env.FRONTEND_ORIGIN?.trim() || 'http://localhost:3000',
    corsOrigin: process.env.CORS_ORIGIN?.trim() || null,
    nodeEnv: process.env.NODE_ENV ?? 'development',
  },
});
