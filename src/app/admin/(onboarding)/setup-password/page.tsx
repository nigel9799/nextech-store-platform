import { updatePasswordAction } from "@/app/admin/actions";
import { AuthCard } from "@/components/admin/auth-card";
import { Notice } from "@/components/admin/notice";
import { requireAuthenticatedUser } from "@/lib/auth/context";

export default async function SetupPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAuthenticatedUser();
  const query = await searchParams;
  return (
    <AuthCard eyebrow="Invitation accepted" title="Create your password">
      <p>
        Your account must use a strong password and authenticator app before
        admin access is enabled.
      </p>
      {query.error ? (
        <Notice type="error">
          Use at least 12 characters with uppercase, lowercase, and a number.
        </Notice>
      ) : null}
      <form className="admin-form" action={updatePasswordAction}>
        <label htmlFor="invited-password">New password</label>
        <input
          id="invited-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
        <button className="admin-button" type="submit">
          Save and set up MFA
        </button>
      </form>
    </AuthCard>
  );
}
