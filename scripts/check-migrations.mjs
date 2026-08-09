import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const migrationDirectory = path.resolve("supabase/migrations");
const rollbackDirectory = path.resolve("supabase/rollbacks");
const files = (await readdir(migrationDirectory))
  .filter((file) => file.endsWith(".sql"))
  .sort();
const expected = [
  "0001_extensions_enums.sql",
  "0002_tenancy_identity.sql",
  "0003_rls_helpers.sql",
  "0004_auth_profile_membership.sql",
  "0005_domain_and_auth_policies.sql",
  "0006_membership_audit.sql",
];

if (JSON.stringify(files) !== JSON.stringify(expected)) {
  throw new Error(`Unexpected migration sequence: ${files.join(", ")}`);
}

const combined = (
  await Promise.all(
    files.map((file) => readFile(path.join(migrationDirectory, file), "utf8")),
  )
)
  .join("\n")
  .toLowerCase();
const tenantTables = [
  "tenants",
  "tenant_domains",
  "profiles",
  "tenant_users",
  "audit_logs",
];

for (const table of tenantTables) {
  if (
    !combined.includes(`alter table public.${table} enable row level security`)
  ) {
    throw new Error(`Missing RLS enablement for public.${table}`);
  }
  if (
    !combined.includes(`alter table public.${table} force row level security`)
  ) {
    throw new Error(`Missing forced RLS for public.${table}`);
  }
}

for (const table of tenantTables) {
  if (!combined.includes(`create policy ${table}_aal2_restriction`)) {
    throw new Error(`Missing restrictive AAL2 policy for public.${table}`);
  }
}

for (const migration of files) {
  const rollbackName = migration.replace(".sql", ".down.sql");
  await readFile(path.join(rollbackDirectory, rollbackName), "utf8");
}

if (/grant\s+(all|insert|update|delete)[\s\S]*\s+to\s+anon\b/i.test(combined)) {
  throw new Error("Anonymous write grant detected in foundation migrations");
}

console.log(
  `Validated ${files.length} ordered migrations, rollbacks, and ${tenantTables.length} RLS-protected tables.`,
);
