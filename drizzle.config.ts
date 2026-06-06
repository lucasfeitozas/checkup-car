import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/core/db/schema.ts",
  out: "./src/core/db/migrations",
  dialect: "sqlite",
  driver: "expo",
  strict: true,
  verbose: true,
});
