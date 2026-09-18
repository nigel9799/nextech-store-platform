"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  StorefrontConfig,
  StorefrontProduct,
} from "@/lib/storefront/types";

const starterSlides = [
  { src: "/showcase/build-1-main.webp", alt: "Nextech RGB gaming PC build" },
  {
    src: "/showcase/build-1-detail.webp",
    alt: "Graphics card and RGB fan detail",
  },
  {
    src: "/showcase/build-1-cooling.webp",
    alt: "Nextech liquid cooling detail",
  },
  {
    src: "/showcase/build-2-setup.webp",
    alt: "Completed Nextech gaming setup",
  },
];

function price(product: StorefrontProduct) {
  if (product.priceMinor === null) return null;
  return new Intl.NumberFormat("en-MT", {
    style: "currency",
    currency: product.currencyCode,
  }).format(product.priceMinor / 100);
}

export function ShowcaseHeader({ config }: { config: StorefrontConfig }) {
  return (
    <header className="showcase-header">
      <Link className="showcase-logo" href="/" aria-label="Nextech home">
        <Image
          src={config.logoPath}
          alt="Nextech"
          width={180}
          height={55}
          priority
        />
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/">Home</Link>
        <Link href="/#prebuilds">Prebuilds</Link>
        <Link href="/gallery-contact">Gallery & Contact</Link>
      </nav>
      <a
        className="showcase-header-cta"
        href="https://m.me/nextechmt"
        target="_blank"
        rel="noreferrer"
      >
        Messenger
      </a>
    </header>
  );
}

export function ShowcaseFooter({ config }: { config: StorefrontConfig }) {
  return (
    <footer className="showcase-footer">
      <div>
        <strong>NEXTECH</strong>
        <span>Custom PCs. Built in Malta.</span>
      </div>
      <div className="showcase-footer-links">
        <Link href="/gallery-contact">Gallery & Contact</Link>
        <a
          href="https://www.facebook.com/nextechmt"
          target="_blank"
          rel="noreferrer"
        >
          Facebook
        </a>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/admin">Admin</Link>
      </div>
      <small>{config.footer.copyright}</small>
    </footer>
  );
}

export function BuildCard({ product }: { product: StorefrontProduct }) {
  return (
    <article className="showcase-build-card">
      <div className="showcase-build-image">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.imageAlt ?? product.name} />
        ) : (
          <Image
            src="/showcase/build-1-main.webp"
            alt="Nextech completed PC build"
            fill
            sizes="(max-width: 700px) 100vw, 50vw"
          />
        )}
        {product.tag ? <span>{product.tag}</span> : null}
      </div>
      <div className="showcase-build-copy">
        <small>COMPLETED BUILD / {product.sku}</small>
        <h3>{product.name}</h3>
        <p className="showcase-build-intro">{product.shortSpec}</p>
        {product.description ? (
          <p className="showcase-build-description">{product.description}</p>
        ) : null}
        <div className="showcase-build-bottom">
          {price(product) ? <b>{price(product)}</b> : <b>Built to order</b>}
          <Link href="/gallery-contact">Enquire about a build →</Link>
        </div>
      </div>
    </article>
  );
}

export function ShowcaseHome({
  config,
  products,
}: {
  config: StorefrontConfig;
  products: StorefrontProduct[];
}) {
  const slides = useMemo(() => {
    const productSlides = products.flatMap((product) =>
      product.imageUrls.map((src, index) => ({
        src,
        alt: `${product.name} photo ${index + 1}`,
      })),
    );
    return productSlides.length ? productSlides : starterSlides;
  }, [products]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % slides.length),
      5500,
    );
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <div
      className="showcase-site"
      style={
        { "--showcase-accent": config.primaryColor } as React.CSSProperties
      }
    >
      <ShowcaseHeader config={config} />
      <main>
        <section className="showcase-hero">
          <div className="showcase-hero-copy">
            <p className="showcase-kicker">BUILT IN MALTA / BUILT AROUND YOU</p>
            <h1>
              PC BUILDS THAT <em>PERFORM</em> AND STAND OUT.
            </h1>
            <p>
              Explore completed Nextech systems, discover the detail behind
              every build and get in touch to create yours.
            </p>
            <div className="showcase-actions">
              <Link href="/gallery-contact">Contact us</Link>
              <Link className="secondary" href="/gallery-contact#gallery">
                View gallery
              </Link>
            </div>
          </div>
          <div
            className="showcase-carousel"
            aria-label="Featured Nextech builds"
          >
            <div className="showcase-carousel-frame">
              {slides.map((slide, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${slide.src}-${index}`}
                  className={index === active ? "is-active" : ""}
                  src={slide.src}
                  alt={slide.alt}
                />
              ))}
              <div className="showcase-carousel-caption">
                <small>FEATURED WORK</small>
                <strong>
                  {String(active + 1).padStart(2, "0")} /{" "}
                  {String(slides.length).padStart(2, "0")}
                </strong>
              </div>
              <button
                className="prev"
                type="button"
                aria-label="Previous image"
                onClick={() =>
                  setActive((active - 1 + slides.length) % slides.length)
                }
              >
                ←
              </button>
              <button
                className="next"
                type="button"
                aria-label="Next image"
                onClick={() => setActive((active + 1) % slides.length)}
              >
                →
              </button>
            </div>
            <div className="showcase-carousel-dots">
              {slides.map((slide, index) => (
                <button
                  key={`${slide.src}-dot-${index}`}
                  className={index === active ? "is-active" : ""}
                  type="button"
                  aria-label={`Show image ${index + 1}`}
                  onClick={() => setActive(index)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="showcase-prebuilds" id="prebuilds">
          <div className="showcase-section-title">
            <p className="showcase-kicker">OUR WORK</p>
            <h2>PREBUILDS.</h2>
            <span>
              Completed PCs designed, assembled and tested by Nextech.
            </span>
          </div>
          <div className="showcase-build-grid">
            {products.length ? (
              products.map((product) => (
                <BuildCard key={product.id} product={product} />
              ))
            ) : (
              <>
                <article className="showcase-placeholder">
                  <Image
                    src="/showcase/build-1-main.webp"
                    alt="Build 1"
                    fill
                    sizes="(max-width: 700px) 100vw, 50vw"
                  />
                  <div>
                    <small>COMPLETED BUILD</small>
                    <h3>Build 1</h3>
                    <p>
                      Add the build story, specifications and optional price
                      from the admin portal.
                    </p>
                  </div>
                </article>
                <article className="showcase-placeholder">
                  <Image
                    src="/showcase/build-2-setup.webp"
                    alt="Build 2"
                    fill
                    sizes="(max-width: 700px) 100vw, 50vw"
                  />
                  <div>
                    <small>COMPLETED BUILD</small>
                    <h3>Build 2</h3>
                    <p>
                      Add the build story, specifications and optional price
                      from the admin portal.
                    </p>
                  </div>
                </article>
              </>
            )}
          </div>
        </section>

        <section className="showcase-home-cta">
          <p className="showcase-kicker">YOUR NEXT BUILD STARTS HERE</p>
          <h2>READY TO BUILD SOMETHING GREAT?</h2>
          <div className="showcase-actions">
            <Link href="/gallery-contact">Contact us</Link>
            <Link className="secondary" href="/gallery-contact#gallery">
              Explore gallery
            </Link>
          </div>
        </section>
      </main>
      <ShowcaseFooter config={config} />
    </div>
  );
}

export { starterSlides };
