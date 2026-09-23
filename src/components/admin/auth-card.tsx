import Image from "next/image";
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
        <Image
          className="auth-brand-logo"
          src="/nextech-logo.png"
          alt="Nextech"
          width={500}
          height={500}
          priority
        />
        <p>Secure administration</p>
        <h1>BUILT FOR CONTROL.</h1>
        <small>Tenant-aware · Role protected · Least privilege</small>
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
