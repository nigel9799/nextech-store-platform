import { updatePasswordAction } from "@/app/admin/actions";
import { AuthCard } from "@/components/admin/auth-card";
import { Notice } from "@/components/admin/notice";
import { requireAuthenticatedUser } from "@/lib/auth/context";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAuthenticatedUser();
  const query = await searchParams;
  return (
    <AuthCard eyebrow="Secure account" title="Choose a new password">
      {query.error ? (
        <Notice type="error">
          Use at least 12 characters with uppercase, lowercase, and a number.
        </Notice>
      ) : null}
      <form className="admin-form" action={updatePasswordAction}>
        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
        <button className="admin-button" type="submit">
          Save password
        </button>
      </form>
    </AuthCard>
  );
}
