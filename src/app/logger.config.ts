import { Params } from 'nestjs-pino';

export const loggerOptions = (): Params => {
  const isProduction = process.env.NODE_ENV === 'production';

  const defaultOptions: Params = {
    pinoHttp: {
      level: process.env.LOG_LEVEL || 'info',
    },
  };

  if (isProduction) return defaultOptions;

  return {
    ...defaultOptions,
    pinoHttp: {
      ...defaultOptions.pinoHttp,
      transport: {
        target: 'pino-pretty',
        options: {
          singleLine: true,
          colorize: true,
          ignore: 'pid,hostname',
        },
      },
    },
  };
};

