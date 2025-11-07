import { Provider } from '@nestjs/common';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { APP_PIPE } from '@nestjs/core';

export const ZodValidationPipeProvider: Provider = {
  provide: APP_PIPE,
  useClass: ZodValidationPipe,
};
