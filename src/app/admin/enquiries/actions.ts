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
