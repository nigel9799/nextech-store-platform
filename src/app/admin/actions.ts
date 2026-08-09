"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  requireAdminContext,
  requireAuthenticatedUser,
} from "@/lib/auth/context";
import { tenantRoles } from "@/lib/auth/permissions";
import { getServerEnvironment } from "@/lib/env/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(256),
});
const passwordSchema = z
  .string()
  .min(12)
  .max(256)
  .regex(/[a-z]/, "Use a lowercase letter")
  .regex(/[A-Z]/, "Use an uppercase letter")
  .regex(/[0-9]/, "Use a number");

export async function loginAction(formData: FormData) {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/login?error=invalid");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect("/admin/login?error=invalid");

  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  redirect(
    data?.nextLevel === "aal2" ? "/admin/mfa/challenge" : "/admin/mfa/enroll",
  );
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = z
    .string()
    .trim()
    .email()
    .max(254)
    .safeParse(formData.get("email"));
  if (email.success) {
    const supabase = await createClient();
    const baseUrl = getServerEnvironment().AUTH_REDIRECT_BASE_URL;
    await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${baseUrl}/auth/confirm?next=/admin/update-password`,
    });
  }
  redirect("/admin/forgot-password?notice=sent");
}

export async function updatePasswordAction(formData: FormData) {
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) redirect("/admin/update-password?error=weak");
  const { supabase } = await requireAuthenticatedUser();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) redirect("/admin/update-password?error=failed");
  redirect("/admin/mfa/enroll");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/admin/login?notice=signed-out");
}

export async function inviteMemberAction(formData: FormData) {
  const context = await requireAdminContext("manage_members");
  const parsed = z
    .object({
      email: z.string().trim().email().max(254),
      role: z.enum(tenantRoles),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/team?error=invalid-invite");

  const service = createServiceRoleClient();
  const baseUrl = getServerEnvironment().AUTH_REDIRECT_BASE_URL;
  const { data, error } = await service.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: { display_name: parsed.data.email.split("@")[0] },
      redirectTo: `${baseUrl}/auth/confirm?next=/admin/setup-password`,
    },
  );
  if (error || !data.user) redirect("/admin/team?error=invite-failed");

  const supabase = await createClient();
  const { error: membershipError } = await supabase
    .from("tenant_users")
    .insert({
      tenant_id: context.tenant.id,
      user_id: data.user.id,
      role: parsed.data.role,
      status: "invited",
      invited_by: context.user.id,
      invited_at: new Date().toISOString(),
    });
  if (membershipError) {
    await service.auth.admin.deleteUser(data.user.id);
    redirect("/admin/team?error=membership-failed");
  }

  revalidatePath("/admin/team");
  redirect("/admin/team?notice=invited");
}

export async function updateMemberAction(formData: FormData) {
  const context = await requireAdminContext("manage_members");
  const parsed = z
    .object({
      membershipId: z.string().uuid(),
      role: z.enum(tenantRoles),
      status: z.enum(["active", "suspended"]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/team?error=invalid-member");

  const supabase = await createClient();
  const updates = {
    role: parsed.data.role,
    status: parsed.data.status,
    deactivated_at:
      parsed.data.status === "suspended" ? new Date().toISOString() : null,
    joined_at:
      parsed.data.status === "active" ? new Date().toISOString() : null,
  };
  const { error } = await supabase
    .from("tenant_users")
    .update(updates)
    .eq("id", parsed.data.membershipId)
    .eq("tenant_id", context.tenant.id);
  if (error) redirect("/admin/team?error=member-update-failed");

  revalidatePath("/admin/team");
  redirect("/admin/team?notice=updated");
}
