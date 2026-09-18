"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

export async function updateEnquiryStatusAction(formData: FormData) {
  const context = await requireAdminContext("manage_enquiries");
  const parsed = z
    .object({
      id: z.string().uuid(),
      status: z.enum(["new", "contacted", "quoted", "closed"]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/enquiries?error=invalid");
  const supabase = await createClient();
  const { error } = await supabase
    .from("enquiries")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .eq("tenant_id", context.tenant.id);
  if (error) redirect("/admin/enquiries?error=save-failed");
  revalidatePath("/admin/enquiries");
  redirect("/admin/enquiries?notice=updated");
}

export async function addEnquiryCommentAction(formData: FormData) {
  const context = await requireAdminContext("manage_enquiries");
  const parsed = z
    .object({
      id: z.string().uuid(),
      status: z.enum(["all", "new", "contacted", "quoted", "closed"]),
      comment: z.string().trim().min(1).max(2000),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/enquiries?error=invalid-comment");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", context.user.id)
    .maybeSingle();
  const authorName = profile?.display_name?.trim() || context.user.email;
  const { error } = await supabase.from("enquiry_comments").insert({
    tenant_id: context.tenant.id,
    enquiry_id: parsed.data.id,
    author_user_id: context.user.id,
    author_name: authorName,
    body: parsed.data.comment,
  });
  const suffix =
    parsed.data.status === "all" ? "" : `&status=${parsed.data.status}`;
  if (error) redirect(`/admin/enquiries?error=comment-failed${suffix}`);
  revalidatePath("/admin/enquiries");
  redirect(`/admin/enquiries?notice=comment-added${suffix}`);
}
