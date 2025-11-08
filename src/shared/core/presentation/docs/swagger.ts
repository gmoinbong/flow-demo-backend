import { patchNestjsSwagger } from '@anatine/zod-nestjs';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export class Swagger {
  private static readonly config = {
    title: 'CreatorFlow Backend API',
    description: `
      CreatorFlow Backend API
      
      **Modules:** Auth, Profile, Scraper
      
      **Authentication:**
      1. POST /auth/login → получить accessToken
      2. Нажать "Authorize" (🔒) → вставить токен
      3. Защищенные эндпоинты доступны
    `,
    version: '0.0.1',
    tags: [],
  };

  static apply(app: INestApplication) {
    const documentConfig = new DocumentBuilder()
      .setTitle(this.config.title)
      .setDescription(this.config.description)
      .setVersion(this.config.version)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT токен из /auth/login',
          name: 'Authorization',
          in: 'header',
        },
        'bearer', // Security scheme name - must match @ApiBearerAuth('bearer')
      )
      .addTag('Auth', 'Authentication and authorization endpoints')
      .addTag('Profile', 'User profile management endpoints')
      .addTag('Scraper', 'Social media scraping endpoints')
      .build();

    patchNestjsSwagger();

    const document = SwaggerModule.createDocument(app, documentConfig);

    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 3,
        defaultModelExpandDepth: 3,
      },
      customSiteTitle: 'CreatorFlow API Documentation',
      customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .scheme-container { margin: 20px 0; padding: 20px; background: #fafafa; border-radius: 4px; }
      `,
    });
  }
}
