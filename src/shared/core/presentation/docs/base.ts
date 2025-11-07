import { ApiBearerAuth } from '@nestjs/swagger';

export const baseDocs = [];

export const authBase = [...baseDocs, ApiBearerAuth()];
