export default () => ({
  app: {
    serviceName: "spliton-backend",
    port: Number(process.env.PORT ?? 4000),
    corsOrigin: process.env.CORS_ORIGIN ?? "*",
    nodeEnv: process.env.NODE_ENV ?? "development",
  },
});
