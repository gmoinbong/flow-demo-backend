import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger } from 'nestjs-pino';
import { Swagger } from './shared/core/presentation/docs/swagger';

async function bootstrap() {
  try {
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
    const host = process.env.HOSTNAME || '0.0.0.0';
    
    await app.listen(port, host);

    logger.log(`🚀 API is running on: http://${host}:${port}`);
    logger.log(`📚 Swagger docs: http://${host}:${port}/api/docs`);
    logger.log(`🏥 Health check: http://${host}:${port}/api/health`);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();
