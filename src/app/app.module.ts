import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { loggerOptions } from './logger.config';
import { AppController } from './app.controller';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { SharedModule } from 'src/shared';
import { AuthModule } from 'src/modules/auth/auth.module';
import { ProfileModule } from 'src/modules/profile/profile.module';
import { ScraperModule } from 'src/modules/scraper/scraper.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    SharedModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
    }),
    LoggerModule.forRoot(loggerOptions()),
    AuthModule,
    ProfileModule,
    ScraperModule,
  ],
})
export class AppModule {}
