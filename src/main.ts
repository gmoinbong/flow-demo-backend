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

  Swagger.apply(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
