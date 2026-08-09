import type { ReactNode } from "react";

export function AuthCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-shell">
      <section className="auth-brand" aria-label="Nextech administration">
        <span className="auth-brand-mark">NX</span>
        <p>Secure administration</p>
        <h1>BUILT FOR CONTROL.</h1>
        <small>Tenant-aware · MFA protected · Least privilege</small>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <p className="admin-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          {children}
        </div>
      </section>
    </main>
  );
}
