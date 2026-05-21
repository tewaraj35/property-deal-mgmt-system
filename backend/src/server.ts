import { createApp } from "./app";
import { config } from "./utils/env-config";

const app = createApp();

app.listen(config.port, () => {
  console.log(`
  ✅ Server started successfully!

  Environment: ${config.nodeEnv}
  Port: ${config.port}
  API: ${config.apiBaseUrl}
  Frontend: ${config.frontendUrl}

  📍 Health Check: http://localhost:${config.port}/health
  📍 API Info: http://localhost:${config.port}/api/v1
  `);
});

// Handle unhandled rejections
process.on("unhandledRejection", (reason, _promise) => {
  console.error("[Unhandled Rejection]", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("[Uncaught Exception]", error);
  process.exit(1);
});
