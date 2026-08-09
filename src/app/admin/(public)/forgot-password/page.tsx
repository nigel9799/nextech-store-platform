import Link from "next/link";
import { requestPasswordResetAction } from "@/app/admin/actions";
import { AuthCard } from "@/components/admin/auth-card";
import { Notice } from "@/components/admin/notice";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const query = await searchParams;
  return (
    <AuthCard eyebrow="Account recovery" title="Reset your password">
      {query.notice ? (
        <Notice>
          If an invited account exists, a reset message has been sent.
        </Notice>
      ) : null}
      <form className="admin-form" action={requestPasswordResetAction}>
        <label htmlFor="recovery-email">Email address</label>
        <input
          id="recovery-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <button className="admin-button" type="submit">
          Send reset link
        </button>
      </form>
      <div className="auth-links">
        <Link href="/admin/login">Return to sign in</Link>
      </div>
    </AuthCard>
  );
}
