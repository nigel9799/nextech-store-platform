import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { resolveRequestTenant } from "@/lib/tenancy/resolve";
import { type Capability, hasCapability, type TenantRole } from "./permissions";

export type AdminContext = {
  user: { id: string; email: string };
  tenant: Awaited<ReturnType<typeof resolveRequestTenant>>;
  membership: { id: string; role: TenantRole; status: "active" };
};

export async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/admin/login");
  return { supabase, user: data.user };
}

export async function requireAdminContext(
  capability: Capability = "access_admin",
): Promise<AdminContext> {
  const tenant = await resolveRequestTenant();
  const { supabase, user } = await requireAuthenticatedUser();

  const { data: membership } = await supabase
    .from("tenant_users")
    .select("id, role, status")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  let activeMembership = membership;
  if (membership?.status === "invited") {
    const service = createServiceRoleClient();
    const { data } = await service
      .from("tenant_users")
      .update({ status: "active", joined_at: new Date().toISOString() })
      .eq("id", membership.id)
      .eq("tenant_id", tenant.id)
      .eq("user_id", user.id)
      .eq("status", "invited")
      .select("id, role, status")
      .single();
    activeMembership = data;
  }

  if (!activeMembership || activeMembership.status !== "active") {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/admin/login?notice=access-revoked");
  }

  const role = activeMembership.role as TenantRole;
  if (!hasCapability(role, capability)) redirect("/admin?notice=forbidden");

  return {
    user: { id: user.id, email: user.email ?? "" },
    tenant,
    membership: { id: activeMembership.id, role, status: "active" },
  };
}
