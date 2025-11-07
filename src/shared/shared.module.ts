import { Global, Module } from '@nestjs/common';
import { DatabaseProvider } from './core/infrastructure/database/database.provider';
import { ZodValidationPipeProvider } from './core/infrastructure/zod/zod.provider';
@Module({
  providers: [...DatabaseProvider, ZodValidationPipeProvider],
  exports: [...DatabaseProvider],
})
@Global()
export class SharedModule {}
