import { env } from './config/env';
import { logger } from './utils/logger';
import { app } from './app';

const PORT = env.port;

app.listen(PORT, () => {
  logger.info(`Backend server started`, { port: PORT, nodeEnv: env.nodeEnv });
});
