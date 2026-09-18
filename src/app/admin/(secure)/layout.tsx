import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { requireAdminContext } from "@/lib/auth/context";
import { hasCapability, roleLabel } from "@/lib/auth/permissions";

export default async function SecureAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireAdminContext();
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-logo" href="/admin">
          <strong>NX</strong>
          <span>NEXTECH</span>
        </Link>
        <nav aria-label="Admin navigation">
          <Link href="/admin">Overview</Link>
          {hasCapability(context.membership.role, "manage_catalogue") ? (
            <>
              <Link href="/admin/catalogue/products">Products</Link>
              <Link href="/admin/catalogue/categories">Categories</Link>
            </>
          ) : null}
          {hasCapability(context.membership.role, "manage_enquiries") ? (
            <Link href="/admin/enquiries">Enquiries</Link>
          ) : null}
          {hasCapability(context.membership.role, "manage_website") ? (
            <Link href="/admin/settings">Store settings</Link>
          ) : null}
          {hasCapability(context.membership.role, "manage_members") ? (
            <Link href="/admin/team">Team & roles</Link>
          ) : null}
        </nav>
        <div className="admin-sidebar-foot">
          <span>{roleLabel(context.membership.role)}</span>
          <small>{context.user.email}</small>
          <form action={logoutAction}>
            <button type="submit">Log out</button>
          </form>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <small>TENANT</small>
            <strong>{context.tenant.businessName}</strong>
          </div>
          <div className="admin-topbar-actions">
            <Link href="/" target="_blank" rel="noreferrer">
              View website ↗
            </Link>
            <span>SECURE ADMIN</span>
          </div>
        </header>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
