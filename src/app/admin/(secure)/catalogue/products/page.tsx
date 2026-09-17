import Link from "next/link";
import {
  archiveProductAction,
  deleteProductAction,
} from "@/app/admin/catalogue/actions";
import { errorMessages } from "@/components/admin/catalogue-forms";
import { requireAdminContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

const notices: Record<string, string> = {
  created: "Product created successfully.",
  updated: "Product updated successfully.",
  archived: "Product archived and removed from the storefront.",
  deleted: "Product permanently deleted.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const context = await requireAdminContext("manage_catalogue");
  const supabase = await createClient();
  const query = await searchParams;
  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, sku, price_minor, status, display_order, category:product_categories(name)",
    )
    .eq("tenant_id", context.tenant.id)
    .order("display_order");

  return (
    <>
      <div className="admin-heading admin-heading-row">
        <div>
          <p className="admin-eyebrow">Catalogue</p>
          <h1>PRODUCTS</h1>
          <p>Only products marked Live appear on the public storefront.</p>
        </div>
        <Link className="admin-button" href="/admin/catalogue/products/new">
          Add product
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
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((product) => {
                const category = Array.isArray(product.category)
                  ? product.category[0]
                  : product.category;
                return (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <small>{product.sku}</small>
                    </td>
                    <td>{category?.name ?? "—"}</td>
                    <td>€{(product.price_minor / 100).toFixed(2)}</td>
                    <td>
                      <span
                        className={`admin-status admin-status-${product.status}`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td>{product.display_order}</td>
                    <td className="admin-row-actions">
                      <Link
                        href={`/admin/catalogue/products/${product.id}/edit`}
                      >
                        Edit
                      </Link>
                      {product.status !== "archived" ? (
                        <form action={archiveProductAction}>
                          <input type="hidden" name="id" value={product.id} />
                          <button type="submit">Archive</button>
                        </form>
                      ) : null}
                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <button className="danger" type="submit">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {!products?.length ? (
                <tr>
                  <td colSpan={6}>
                    No products yet. Add your first product to begin.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
