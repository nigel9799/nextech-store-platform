import { createProductAction } from "@/app/admin/catalogue/actions";
import { errorMessages, ProductForm } from "@/components/admin/catalogue-forms";
import { requireAdminContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const context = await requireAdminContext("manage_catalogue");
  const supabase = await createClient();
  const query = await searchParams;
  const { data: categories } = await supabase
    .from("product_categories")
    .select("id, name, slug, display_order, is_visible")
    .eq("tenant_id", context.tenant.id)
    .order("display_order");
  return (
    <>
      <div className="admin-heading">
        <p className="admin-eyebrow">Catalogue</p>
        <h1>ADD PRODUCT</h1>
        <p>
          Create a product, then mark it Live when it is ready for customers.
        </p>
      </div>
      {query.error ? (
        <p className="form-notice form-notice-error" role="alert">
          {errorMessages[query.error] ?? errorMessages.invalid}
        </p>
      ) : null}
      {categories?.length ? (
        <section className="admin-panel">
          <ProductForm action={createProductAction} categories={categories} />
        </section>
      ) : (
        <section className="admin-placeholder">
          <h2>Create a category first</h2>
          <p>Every product must belong to a category.</p>
        </section>
      )}
    </>
  );
}
