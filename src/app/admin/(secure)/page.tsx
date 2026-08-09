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
        <p className="admin-eyebrow">Security foundation</p>
        <h1>ADMIN OVERVIEW</h1>
        <p>Tenant-scoped access is active for this session.</p>
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
          <span>Password + TOTP</span>
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
      <section className="admin-placeholder">
        <h2>Milestone 2 complete boundary</h2>
        <p>
          Storefront, catalogue, products, enquiries, and website editing remain
          intentionally unavailable until their approved milestones.
        </p>
      </section>
    </>
  );
}
