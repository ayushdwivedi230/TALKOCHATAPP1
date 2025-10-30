import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// Ensure .env values override any existing environment variables when running locally
dotenv.config({ override: true });

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
