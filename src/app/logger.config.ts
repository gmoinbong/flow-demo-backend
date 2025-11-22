import { Params } from 'nestjs-pino';

const serializers = {
  req: (req: any) => ({
    id: req.id,
    method: req.method,
    url: req.url,
    query: req.query,
    params: req.params,
    headers: req.headers,
    remoteAddress: req.remoteAddress,
    remotePort: req.remotePort,
  }),
  res: (res: any) => ({
    statusCode: res.statusCode,
    headers: res.headers,
  }),
};

export const loggerOptions = (): Params => {
  const isProduction = process.env.NODE_ENV === 'production';
  const logLevel = process.env.LOG_LEVEL || 'info';

  const basePinoHttp = {
    level: logLevel,
    serializers,
  };

  if (isProduction) {
    // Production: raw JSON format
    return {
      pinoHttp: basePinoHttp,
    };
  }

  // Development: pretty format for console, raw JSON to file (optional)
  const rawLogFile = process.env.LOG_RAW_FILE;

  if (rawLogFile) {
    // Both pretty console and raw JSON file
    return {
      pinoHttp: {
        ...basePinoHttp,
        transport: {
          targets: [
            {
              target: 'pino-pretty',
              level: logLevel,
              options: {
                colorize: true,
                ignore: 'pid,hostname',
                translateTime: 'HH:MM:ss.l',
                singleLine: false,
                messageFormat: '{req.method} {req.url} - {msg}',
              },
            },
            {
              target: 'pino/file',
              level: logLevel,
              options: {
                destination: rawLogFile,
              },
            },
          ],
        },
      },
    };
  }

  // Pretty format for console only
  return {
    pinoHttp: {
      ...basePinoHttp,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss.l',
          singleLine: false,
          messageFormat: '{req.method} {req.url} - {msg}',
        },
      },
    },
  };
};

