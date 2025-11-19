import z from 'zod';

export const databaseConfigSchema = z.object({
  DATABASE_WRITE_URL: z.string().url(),
  DATABASE_READ_REPLICA_URLS: z.array(z.string().url()),
});

export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;

export const load = {
  from: {
    env: (env: NodeJS.ProcessEnv) => {
      const replicaUrls = env.DATABASE_READ_REPLICA_URLS
        ? env.DATABASE_READ_REPLICA_URLS.split(',').filter((url) => url.trim())
        : [];

      const cfg: DatabaseConfig = {
        DATABASE_WRITE_URL: env.DATABASE_WRITE_URL!,
        DATABASE_READ_REPLICA_URLS: replicaUrls,
      };

      return load.from.row(cfg);
    },
    row: (row: DatabaseConfig) => {
      return databaseConfigSchema.parse(row);
    },
  },
};
