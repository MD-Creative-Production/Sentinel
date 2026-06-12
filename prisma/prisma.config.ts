import { defineConfig } from "@prisma/internals";

export default defineConfig({
  prismaConfigPath: process.env.PRISMA_CONFIG_PATH,
});
