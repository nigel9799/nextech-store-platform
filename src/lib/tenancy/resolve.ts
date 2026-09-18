import "server-only";
import { headers } from "next/headers";
import { getServerEnvironment } from "@/lib/env/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isLocalHostname, normalizeHostname } from "./hostname";

export type TenantContext = {
  id: string;
  slug: string;
  businessName: string;
  hostname: string;
};

export class TenantResolutionError extends Error {}

export async function resolveTenant(
  hostHeader: string,
): Promise<TenantContext> {
  const hostname = normalizeHostname(hostHeader);
  const environment = getServerEnvironment();
  const supabase = createServiceRoleClient();
  const vercelPreviewHostname = process.env.VERCEL_URL
    ? normalizeHostname(process.env.VERCEL_URL)
    : null;
  const productionHostname = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? normalizeHostname(process.env.VERCEL_PROJECT_PRODUCTION_URL)
    : null;
  const isTrustedVercelPreview =
    process.env.VERCEL_ENV === "preview" &&
    vercelPreviewHostname === hostname &&
    productionHostname !== null;

  if (
    isLocalHostname(hostname) &&
    ["development", "test", "preview"].includes(environment.APP_ENV) &&
    environment.DEFAULT_TENANT_SLUG
  ) {
    const { data, error } = await supabase
      .from("tenants")
      .select("id, slug, business_name, status")
      .eq("slug", environment.DEFAULT_TENANT_SLUG)
      .in("status", ["onboarding", "active"])
      .single();
    if (error || !data)
      throw new TenantResolutionError("Local tenant is not configured");
    return {
      id: data.id,
      slug: data.slug,
      businessName: data.business_name,
      hostname,
    };
  }

  const tenantLookupHostname = isTrustedVercelPreview
    ? productionHostname
    : hostname;
  const { data: domain, error: domainError } = await supabase
    .from("tenant_domains")
    .select("tenant_id")
    .eq("hostname", tenantLookupHostname)
    .not("verified_at", "is", null)
    .single();
  if (domainError || !domain) {
    console.error("Tenant domain lookup failed", {
      hostname,
      code: domainError?.code,
      message: domainError?.message,
    });
    throw new TenantResolutionError("Unknown or unverified hostname");
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, slug, business_name")
    .eq("id", domain.tenant_id)
    .eq("status", "active")
    .single();
  if (tenantError || !tenant)
    throw new TenantResolutionError("Tenant is unavailable");

  return {
    id: tenant.id,
    slug: tenant.slug,
    businessName: tenant.business_name,
    hostname,
  };
}

export async function resolveRequestTenant() {
  const requestHeaders = await headers();
  return resolveTenant(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "",
  );
}
