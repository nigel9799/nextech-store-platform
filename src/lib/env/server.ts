import "server-only";
import { z } from "zod";

const serverEnvironmentSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  APP_ENV: z.enum(["development", "test", "preview", "production"]),
  DEFAULT_TENANT_SLUG: z.string().min(1).optional(),
  AUTH_REDIRECT_BASE_URL: z.url(),
});

export function getServerEnvironment() {
  const values = serverEnvironmentSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY,
    APP_ENV: process.env.APP_ENV,
    DEFAULT_TENANT_SLUG: process.env.DEFAULT_TENANT_SLUG,
    AUTH_REDIRECT_BASE_URL: process.env.AUTH_REDIRECT_BASE_URL,
  });

  if (values.APP_ENV === "production" && values.DEFAULT_TENANT_SLUG) {
    throw new Error("DEFAULT_TENANT_SLUG must not be configured in production");
  }

  return values;
}
