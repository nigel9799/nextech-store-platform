import { redirect } from "next/navigation";
import { requireAdminContext } from "@/lib/auth/context";
import { hasCapability } from "@/lib/auth/permissions";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const context = await requireAdminContext();
  const query = await searchParams;
  const suffix = query.notice === "forbidden" ? "?error=forbidden" : "";
  if (hasCapability(context.membership.role, "manage_catalogue"))
    redirect(`/admin/catalogue/products${suffix}`);
  if (hasCapability(context.membership.role, "manage_enquiries"))
    redirect(`/admin/enquiries${suffix}`);
  if (hasCapability(context.membership.role, "manage_website"))
    redirect(`/admin/settings${suffix}`);
  redirect("/");
}
