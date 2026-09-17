import { notFound } from "next/navigation";
import { updateCategoryAction } from "@/app/admin/catalogue/actions";
import {
  CategoryForm,
  errorMessages,
} from "@/components/admin/catalogue-forms";
import { requireAdminContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const context = await requireAdminContext("manage_catalogue");
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("product_categories")
    .select("id, name, slug, display_order, is_visible")
    .eq("tenant_id", context.tenant.id)
    .eq("id", id)
    .maybeSingle();
  if (!category) notFound();
  return (
    <>
      <div className="admin-heading">
        <p className="admin-eyebrow">Catalogue</p>
        <h1>EDIT CATEGORY</h1>
        <p>
          Hiding this category also removes its products from public browsing.
        </p>
      </div>
      {query.error ? (
        <p className="form-notice form-notice-error" role="alert">
          {errorMessages[query.error] ?? errorMessages.invalid}
        </p>
      ) : null}
      <section className="admin-panel">
        <CategoryForm action={updateCategoryAction} category={category} />
      </section>
    </>
  );
}
