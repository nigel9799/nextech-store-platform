import Link from "next/link";
import Image from "next/image";
import { getLegalPage } from "@/lib/storefront/repository";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const page = await getLegalPage("privacy");
  return (
    <main className="storefront-legal-page">
      <header className="storefront-legal-header">
        <Link href="/" aria-label="Return to Nextech storefront">
          <Image
            src="/nextech-logo.png"
            alt="Nextech Malta"
            width={105}
            height={65}
            priority
          />
        </Link>
        <Link href="/">Back to store ↗</Link>
      </header>
      <article>
        <p className="storefront-eyebrow">
          <i aria-hidden="true" />
          Nextech information
        </p>
        <h1>{page.title}</h1>
        <div className="storefront-legal-copy">
          <p>{page.body}</p>
          <div className="storefront-legal-contact">
            <b>Questions about this page?</b>
            <a href="mailto:info@nextechmt.com">info@nextechmt.com</a>
          </div>
        </div>
        <p className="storefront-legal-review">Last updated September 2026.</p>
      </article>
      <footer>
        <span>© 2026 Nextech Malta. All rights reserved.</span>
        <Link href="/">Return to storefront</Link>
      </footer>
    </main>
  );
}
