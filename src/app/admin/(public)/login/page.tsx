import Link from "next/link";
import { AuthCard } from "@/components/admin/auth-card";
import { Notice } from "@/components/admin/notice";
import { loginAction } from "@/app/admin/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  return (
    <AuthCard eyebrow="Nextech administration" title="Sign in securely">
      {query.error ? (
        <Notice type="error">The email or password was not accepted.</Notice>
      ) : null}
      {query.notice === "access-revoked" ? (
        <Notice type="error">Your tenant access is no longer active.</Notice>
      ) : null}
      {query.notice === "signed-out" ? (
        <Notice>You have signed out safely.</Notice>
      ) : null}
      <form className="admin-form" action={loginAction}>
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <button className="admin-button" type="submit">
          Sign in
        </button>
      </form>
      <div className="auth-links">
        <Link href="/admin/forgot-password">Forgot password?</Link>
      </div>
      <p className="auth-help">
        Accounts are invitation-only. Contact the Nextech owner if you need
        access.
      </p>
    </AuthCard>
  );
}
