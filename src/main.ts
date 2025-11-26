import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger } from 'nestjs-pino';
import { Swagger } from './shared/core/presentation/docs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    snapshot: true,
  });

  const logger = app.get<Logger>(Logger);

  app.useLogger(logger);

  // Global prefix
  app.setGlobalPrefix('api');

  Swagger.apply(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 API is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  logger.log(`🏥 Health check: http://localhost:${port}/api/health`);
}
bootstrap();
