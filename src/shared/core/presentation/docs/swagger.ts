import { patchNestjsSwagger } from '@anatine/zod-nestjs';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export class Swagger {
  private static readonly config = {
    title: 'CreatorFlow Backend API',
    description: 'CreatorFlow Backend API',
    version: '0.0.1',
    tags: [],
  };

  static apply(app: INestApplication) {
    const documentConfig = new DocumentBuilder()
      .setTitle(this.config.title)
      .setDescription(this.config.description)
      .setVersion(this.config.version)
      .addBearerAuth()
      .build();

    patchNestjsSwagger();

    const document = SwaggerModule.createDocument(app, documentConfig);

    SwaggerModule.setup('docs', app, document);
  }
}
