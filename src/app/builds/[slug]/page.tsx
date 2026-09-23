import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShowcaseFooter,
  ShowcaseHeader,
} from "@/components/storefront/showcase-shell";
import { MessengerIcon } from "@/components/storefront/messenger-icon";
import { getStorefrontData } from "@/lib/storefront/repository";

export const dynamic = "force-dynamic";

function formatPrice(priceMinor: number, currencyCode: string) {
  return new Intl.NumberFormat("en-MT", {
    style: "currency",
    currency: currencyCode,
  }).format(priceMinor / 100);
}

export default async function BuildCaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const storefront = await getStorefrontData();
  const { slug } = await params;
  const build = storefront.products.find((product) => product.slug === slug);
  if (!build) notFound();

  const images = build.imageUrls.length
    ? build.imageUrls
    : [build.imageUrl ?? "/showcase/build-1-main.webp"];

  return (
    <div
      className="showcase-site"
      style={
        {
          "--showcase-accent": storefront.config.primaryColor,
        } as React.CSSProperties
      }
    >
      <ShowcaseHeader config={storefront.config} />
      <main>
        <section className="case-study-hero">
          <div className="case-study-copy">
            <p className="showcase-kicker">COMPLETED BUILD / {build.sku}</p>
            <h1>{build.name}</h1>
            <p>{build.shortSpec}</p>
            <div className="case-study-meta">
              <span>{build.tag ?? "Nextech custom build"}</span>
              <strong>
                {build.priceMinor === null
                  ? "Built to order"
                  : formatPrice(build.priceMinor, build.currencyCode)}
              </strong>
            </div>
            <div className="showcase-actions">
              <Link href="/gallery-contact#contact">Enquire about a build</Link>
              <Link className="secondary" href="/gallery-contact#gallery">
                Back to gallery
              </Link>
            </div>
          </div>
          <div className="case-study-cover">
            {images[0].startsWith("/") ? (
              <Image
                src={images[0]}
                alt={build.imageAlt ?? build.name}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 55vw"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[0]} alt={build.imageAlt ?? build.name} />
            )}
          </div>
        </section>

        <section className="case-study-details">
          <div>
            <p className="showcase-kicker">THE BUILD</p>
            <h2>DESIGNED WITH PURPOSE.</h2>
          </div>
          <div className="case-study-description">
            {build.description ? (
              <p>{build.description}</p>
            ) : (
              <p>
                Full project background, component specifications and build
                details can be added from the Nextech admin portal.
              </p>
            )}
          </div>
        </section>

        <section
          className="case-study-gallery"
          aria-label={`${build.name} gallery`}
        >
          {images.map((src, index) => (
            <figure key={`${src}-${index}`}>
              {src.startsWith("/") ? (
                <Image
                  src={src}
                  alt={`${build.name} detail ${index + 1}`}
                  fill
                  sizes="(max-width: 700px) 100vw, 50vw"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={`${build.name} detail ${index + 1}`} />
              )}
            </figure>
          ))}
        </section>

        <section className="showcase-home-cta case-study-cta">
          <p className="showcase-kicker">INSPIRED BY THIS BUILD?</p>
          <h2>LET’S CREATE YOURS.</h2>
          <div className="showcase-actions">
            <Link href="/gallery-contact#contact">Contact Nextech</Link>
            <a
              className="secondary"
              href="https://m.me/nextechmt"
              target="_blank"
              rel="noreferrer"
            >
              <MessengerIcon />
              Message on Facebook
            </a>
          </div>
        </section>
      </main>
      <ShowcaseFooter config={storefront.config} />
    </div>
  );
}
