import { defineConfig } from '@prisma/internals';
import 'dotenv/config';

export default defineConfig({
  prismaConfigPath: process.env.PRISMA_CONFIG_PATH,
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL || 'postgresql://test_user:test_password@localhost:5432/test_db',
    },
  },
});
