import Link from "next/link";
import {
  archiveProductAction,
  deleteProductAction,
} from "@/app/admin/catalogue/actions";
import { errorMessages } from "@/components/admin/catalogue-forms";
import { requireAdminContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

const notices: Record<string, string> = {
  created: "Build created successfully.",
  updated: "Build updated successfully.",
  archived: "Build archived and removed from the showcase.",
  deleted: "Build permanently deleted.",
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
    .select("id, name, slug, sku, price_minor, status, display_order")
    .eq("tenant_id", context.tenant.id)
    .order("display_order");

  return (
    <>
      <div className="admin-heading admin-heading-row">
        <div>
          <p className="admin-eyebrow">Catalogue</p>
          <h1>BUILD PAGES</h1>
          <p>
            Create each build like a blog post with a cover, gallery, story and
            specifications. Only entries marked Live appear publicly.
          </p>
        </div>
        <Link className="admin-button" href="/admin/catalogue/products/new">
          Add build
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
                <th>Build</th>
                <th>Price</th>
                <th>Status</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((product) => {
                return (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <small>{product.sku}</small>
                    </td>
                    <td>
                      {typeof product.price_minor === "number"
                        ? `€${(product.price_minor / 100).toFixed(2)}`
                        : "Not displayed"}
                    </td>
                    <td>
                      <span
                        className={`admin-status admin-status-${product.status}`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td>{product.display_order}</td>
                    <td className="admin-row-actions">
                      {product.status === "live" ? (
                        <Link href={`/builds/${product.slug}`}>View</Link>
                      ) : null}
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
                  <td colSpan={5}>No builds yet. Add Build 1 to begin.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
