import { notFound } from "next/navigation";
import { updateProductAction } from "@/app/admin/catalogue/actions";
import { errorMessages, ProductForm } from "@/components/admin/catalogue-forms";
import { requireAdminContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

export default async function EditProductPage({
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
  const [{ data: product }, { data: categories }, { data: images }] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, slug, sku, category_id, short_spec, description, price_minor, old_price_minor, status, tag, show_in_gallery, display_order",
        )
        .eq("tenant_id", context.tenant.id)
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("product_categories")
        .select("id, name, slug, display_order, is_visible")
        .eq("tenant_id", context.tenant.id)
        .order("display_order"),
      supabase
        .from("product_images")
        .select("storage_path")
        .eq("tenant_id", context.tenant.id)
        .eq("product_id", id)
        .eq("status", "published")
        .order("display_order"),
    ]);
  if (!product) notFound();
  return (
    <>
      <div className="admin-heading">
        <p className="admin-eyebrow">Catalogue</p>
        <h1>EDIT COMPLETED BUILD</h1>
        <p>Changes to a Live build appear on the showcase immediately.</p>
      </div>
      {query.error ? (
        <p className="form-notice form-notice-error" role="alert">
          {errorMessages[query.error] ?? errorMessages.invalid}
        </p>
      ) : null}
      <section className="admin-panel">
        <ProductForm
          action={updateProductAction}
          categories={categories ?? []}
          preserveDraft={Boolean(query.error)}
          product={{
            ...product,
            imageUrls: (images ?? []).map((image) => image.storage_path),
          }}
        />
      </section>
    </>
  );
}
