import { requireAdminContext } from "@/lib/auth/context";
import { roleLabel } from "@/lib/auth/permissions";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const context = await requireAdminContext();
  const query = await searchParams;
  return (
    <>
      <div className="admin-heading">
        <p className="admin-eyebrow">Nextech store</p>
        <h1>ADMIN OVERVIEW</h1>
        <p>Manage the live catalogue and essential website settings.</p>
      </div>
      {query.notice === "forbidden" ? (
        <p className="form-notice form-notice-error" role="alert">
          Your role does not permit that area.
        </p>
      ) : null}
      <section className="admin-status-grid" aria-label="Session status">
        <article>
          <small>AUTHENTICATION</small>
          <strong>Verified</strong>
          <span>Secure password session</span>
        </article>
        <article>
          <small>ROLE</small>
          <strong>{roleLabel(context.membership.role)}</strong>
          <span>Least-privilege permissions</span>
        </article>
        <article>
          <small>TENANT</small>
          <strong>{context.tenant.slug}</strong>
          <span>{context.tenant.hostname}</span>
        </article>
      </section>
      <section className="admin-quick-links" aria-label="Store management">
        <a href="/admin/catalogue/products">
          <small>CATALOGUE</small>
          <strong>Manage products</strong>
          <span>Add, price, publish or archive products →</span>
        </a>
        <a href="/admin/catalogue/categories">
          <small>ORGANISATION</small>
          <strong>Manage categories</strong>
          <span>Control storefront product groups →</span>
        </a>
        <a href="/admin/settings">
          <small>WEBSITE</small>
          <strong>Store settings</strong>
          <span>Update branding and contact details →</span>
        </a>
      </section>
    </>
  );
}
