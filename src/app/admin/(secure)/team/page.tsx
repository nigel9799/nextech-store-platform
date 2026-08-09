import { inviteMemberAction, updateMemberAction } from "@/app/admin/actions";
import { Notice } from "@/components/admin/notice";
import { requireAdminContext } from "@/lib/auth/context";
import {
  roleLabel,
  tenantRoles,
  type TenantRole,
} from "@/lib/auth/permissions";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const context = await requireAdminContext("manage_members");
  const query = await searchParams;
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("tenant_users")
    .select("id, user_id, role, status, invited_at, joined_at")
    .eq("tenant_id", context.tenant.id)
    .order("created_at");
  const service = createServiceRoleClient();
  const rows = await Promise.all(
    (memberships ?? []).map(async (membership) => {
      const { data } = await service.auth.admin.getUserById(membership.user_id);
      return { ...membership, email: data.user?.email ?? "Unavailable" };
    }),
  );

  return (
    <>
      <div className="admin-heading">
        <p className="admin-eyebrow">Owner controls</p>
        <h1>TEAM & ROLES</h1>
        <p>Invitations and access changes are applied to this tenant only.</p>
      </div>
      {query.notice === "invited" ? (
        <Notice>
          Invitation created. In local development, open Mailpit to follow the
          link.
        </Notice>
      ) : null}
      {query.notice === "updated" ? (
        <Notice>Membership access was updated immediately.</Notice>
      ) : null}
      {query.error ? (
        <Notice type="error">
          The requested membership change was not completed. The last active
          owner cannot be removed.
        </Notice>
      ) : null}
      <section className="admin-panel">
        <h2>Invite staff member</h2>
        <form className="member-invite" action={inviteMemberAction}>
          <label htmlFor="invite-email">Email</label>
          <input id="invite-email" name="email" type="email" required />
          <label htmlFor="invite-role">Role</label>
          <select id="invite-role" name="role" defaultValue="enquiries_agent">
            {tenantRoles.map((role) => (
              <option key={role} value={role}>
                {roleLabel(role)}
              </option>
            ))}
          </select>
          <button className="admin-button" type="submit">
            Send invitation
          </button>
        </form>
      </section>
      <section className="admin-panel">
        <h2>Current memberships</h2>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.email}</td>
                  <td>{roleLabel(row.role as TenantRole)}</td>
                  <td>
                    <span className={`status-dot status-${row.status}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <form className="member-update" action={updateMemberAction}>
                      <input type="hidden" name="membershipId" value={row.id} />
                      <select name="role" defaultValue={row.role}>
                        {tenantRoles.map((role) => (
                          <option key={role} value={role}>
                            {roleLabel(role)}
                          </option>
                        ))}
                      </select>
                      <select
                        name="status"
                        defaultValue={
                          row.status === "suspended" ? "suspended" : "active"
                        }
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                      <button type="submit">Save</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
