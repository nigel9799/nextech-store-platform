import Link from "next/link";
import { deleteCategoryAction } from "@/app/admin/catalogue/actions";
import { errorMessages } from "@/components/admin/catalogue-forms";
import { requireAdminContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

const notices: Record<string, string> = {
  created: "Category created successfully.",
  updated: "Category updated successfully.",
  deleted: "Category deleted.",
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const context = await requireAdminContext("manage_catalogue");
  const query = await searchParams;
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("product_categories")
    .select("id, name, slug, display_order, is_visible, products(id)")
    .eq("tenant_id", context.tenant.id)
    .order("display_order");
  return (
    <>
      <div className="admin-heading admin-heading-row">
        <div>
          <p className="admin-eyebrow">Catalogue</p>
          <h1>CATEGORIES</h1>
          <p>
            Organise products and control which groups customers can browse.
          </p>
        </div>
        <Link className="admin-button" href="/admin/catalogue/categories/new">
          Add category
        </Link>
      </div>
      {query.notice && notices[query.notice] ? (
        <p className="form-notice" role="status">
          {notices[query.notice]}
        </p>
      ) : null}
      {query.error && errorMessages[query.error] ? (
        <p className="form-notice form-notice-error" role="alert">
          {errorMessages[query.error]}
        </p>
      ) : null}
      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Products</th>
                <th>Visibility</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(categories ?? []).map((category) => (
                <tr key={category.id}>
                  <td>
                    <strong>{category.name}</strong>
                    <small>{category.slug}</small>
                  </td>
                  <td>{category.products?.length ?? 0}</td>
                  <td>{category.is_visible ? "Visible" : "Hidden"}</td>
                  <td>{category.display_order}</td>
                  <td className="admin-row-actions">
                    <Link
                      href={`/admin/catalogue/categories/${category.id}/edit`}
                    >
                      Edit
                    </Link>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <button className="danger" type="submit">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {!categories?.length ? (
                <tr>
                  <td colSpan={5}>No categories yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
