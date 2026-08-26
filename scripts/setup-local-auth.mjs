import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const output = execFileSync(
  process.execPath,
  ["node_modules/supabase/dist/supabase.js", "status", "-o", "env"],
  { encoding: "utf8" },
);
const local = Object.fromEntries(
  output
    .split(/\r?\n/)
    .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map((match) => [match[1], match[2].replace(/"$/, "")]),
);

const apiUrl = local.API_URL;
const publishableKey = local.ANON_KEY;
const serviceRoleKey = local.SERVICE_ROLE_KEY;
if (!apiUrl || !publishableKey || !serviceRoleKey)
  throw new Error("Local Supabase is not running");
const parsedUrl = new URL(apiUrl);
if (!["127.0.0.1", "localhost"].includes(parsedUrl.hostname)) {
  throw new Error("Fixture setup refuses to use a non-local Supabase URL");
}

const service = createClient(apiUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const tenantId = "20000000-0000-4000-8000-000000000100";
const fixtures = [
  {
    email: "owner@local.nextech.test",
    password: "Nextech-local-test-2026!",
    role: "owner",
    displayName: "Local Test Owner",
  },
  {
    email: "recovery-owner@local.nextech.test",
    password: "Nextech-local-recovery-2026!",
    role: "owner",
    displayName: "Local Recovery Owner",
  },
];

const { data: existingUsers } = await service.auth.admin.listUsers({
  perPage: 1000,
});
for (const staleEmail of ["staff-invite@local.nextech.test"]) {
  const stale = existingUsers.users.find((user) => user.email === staleEmail);
  if (stale) await service.auth.admin.deleteUser(stale.id);
}

await service.from("tenants").upsert({
  id: tenantId,
  slug: "nextech",
  status: "active",
  business_name: "Nextech Local Test",
  currency_code: "EUR",
  locale: "en-MT",
  timezone_name: "Europe/Malta",
  pricing_mode: "vat_inclusive",
  default_vat_rate_bps: 1800,
  vat_configured_at: new Date().toISOString(),
});
await service.from("tenant_domains").upsert(
  {
    tenant_id: tenantId,
    hostname: "local.nextech.test",
    is_primary: true,
    verified_at: new Date().toISOString(),
  },
  { onConflict: "hostname" },
);

for (const fixture of fixtures) {
  let user = existingUsers.users.find(
    (candidate) => candidate.email === fixture.email,
  );
  if (!user) {
    const created = await service.auth.admin.createUser({
      email: fixture.email,
      password: fixture.password,
      email_confirm: true,
      user_metadata: { display_name: fixture.displayName },
    });
    if (created.error || !created.data.user)
      throw created.error ?? new Error("Fixture user creation failed");
    user = created.data.user;
  } else {
    const updated = await service.auth.admin.updateUserById(user.id, {
      password: fixture.password,
      email_confirm: true,
      user_metadata: { display_name: fixture.displayName },
    });
    if (updated.error) throw updated.error;
  }

  const membership = await service
    .from("tenant_users")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();
  const membershipData = {
    tenant_id: tenantId,
    user_id: user.id,
    role: fixture.role,
    status: "active",
    joined_at: new Date().toISOString(),
    deactivated_at: null,
  };
  if (membership.data) {
    const updated = await service
      .from("tenant_users")
      .update(membershipData)
      .eq("id", membership.data.id);
    if (updated.error) throw updated.error;
  } else {
    const inserted = await service.from("tenant_users").insert(membershipData);
    if (inserted.error) throw inserted.error;
  }
}

writeFileSync(
  ".env.local",
  [
    `NEXT_PUBLIC_SUPABASE_URL=${apiUrl}`,
    `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${publishableKey}`,
    `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`,
    "APP_ENV=development",
    "DEFAULT_TENANT_SLUG=nextech",
    "AUTH_REDIRECT_BASE_URL=http://127.0.0.1:3000",
    "",
  ].join("\n"),
  { mode: 0o600 },
);

console.log("Local-only authentication fixtures are ready.");
console.log("Owner: owner@local.nextech.test");
console.log("Password: Nextech-local-test-2026!");
console.log("Mailpit: http://127.0.0.1:54324");

execFileSync(process.execPath, ["scripts/seed-local-storefront.mjs"], {
  stdio: "inherit",
});
