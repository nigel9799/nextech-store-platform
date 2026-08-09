import { FoundationGraphic } from "@/components/foundation-graphic";

export default function FoundationPage() {
  return (
    <main className="foundation-shell">
      <div className="foundation-grid" aria-hidden="true" />
      <section className="foundation-copy" aria-labelledby="foundation-title">
        <p className="eyebrow">
          <span /> Built in Malta. Built for you.
        </p>
        <h1 id="foundation-title">
          PRODUCTION
          <br />
          <em>FOUNDATION</em> READY.
        </h1>
        <p>
          The secure Nextech platform foundation is in place. Storefront,
          catalogue, admin, authentication, and enquiry features arrive in their
          approved milestones.
        </p>
        <dl className="foundation-status">
          <div>
            <dt>Milestone</dt>
            <dd>01 / Foundation</dd>
          </div>
          <div>
            <dt>Runtime</dt>
            <dd>Next.js · Supabase · Vercel</dd>
          </div>
          <div>
            <dt>State</dt>
            <dd>Local development only</dd>
          </div>
        </dl>
      </section>
      <FoundationGraphic />
    </main>
  );
}
