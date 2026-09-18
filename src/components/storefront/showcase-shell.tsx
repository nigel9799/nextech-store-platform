"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  StorefrontConfig,
  StorefrontProduct,
} from "@/lib/storefront/types";
import { ShowcaseContactForm } from "./showcase-contact-form";

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
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <div className="storefront-announcement" role="status">
        <span aria-hidden="true">●</span>
        Custom PCs built locally in Malta
        <Link href="/#prebuilds">VIEW BUILDS</Link>
      </div>
      <header className="storefront-header">
        <Link className="storefront-brand" href="/" aria-label="Nextech home">
          <Image
            src={config.logoPath}
            alt={config.brandName}
            width={112}
            height={58}
            priority
          />
        </Link>
        <button
          className="storefront-menu-button"
          type="button"
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={menuOpen}
          aria-controls="storefront-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">☰</span>
        </button>
        <nav
          id="storefront-navigation"
          className={`storefront-navigation${menuOpen ? " is-open" : ""}`}
          aria-label="Primary navigation"
        >
          <Link href="/" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link href="/#prebuilds" onClick={() => setMenuOpen(false)}>
            Prebuilds
          </Link>
          <Link
            href="/gallery-contact#gallery"
            onClick={() => setMenuOpen(false)}
          >
            Gallery
          </Link>
          <Link
            href="/gallery-contact#contact"
            onClick={() => setMenuOpen(false)}
          >
            Contact
          </Link>
        </nav>
        <a
          className="storefront-cart-button"
          href="https://m.me/nextechmt"
          target="_blank"
          rel="noreferrer"
        >
          Messenger
        </a>
      </header>
    </>
  );
}

export function ShowcaseFooter({ config }: { config: StorefrontConfig }) {
  return (
    <footer className="storefront-footer">
      <div className="storefront-footer-main">
        <Image
          src={config.logoPath}
          alt={config.brandName}
          width={145}
          height={76}
        />
        <div>
          <small>CONTACT</small>
          <a href={`tel:${config.contact.phoneOne.replace(/\s/g, "")}`}>
            {config.contact.phoneOne}
          </a>
          <a href="https://m.me/nextechmt" target="_blank" rel="noreferrer">
            Facebook Messenger
          </a>
        </div>
        <div>
          <small>EMAIL US</small>
          <a href={`mailto:${config.contact.email}`}>{config.contact.email}</a>
          <span>{config.contact.location}</span>
        </div>
        <div>
          <small>QUICK LINKS</small>
          <Link href="/#prebuilds">Prebuilds</Link>
          <Link href="/gallery-contact#gallery">Gallery</Link>
          <Link href="/gallery-contact#contact">Contact</Link>
          <Link href="/admin">Admin login</Link>
        </div>
      </div>
      <div className="storefront-footer-bottom">
        <span>{config.footer.copyright}</span>
        <span>
          <Link href="/privacy">Privacy</Link> ·{" "}
          <Link href="/terms">Terms</Link> ·{" "}
          <Link href="/delivery-returns">Delivery & returns</Link>
        </span>
      </div>
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

        <section
          className="showcase-contact showcase-contact-home"
          id="contact"
        >
          <div className="showcase-contact-copy">
            <p className="showcase-kicker">CONTACT NEXTECH</p>
            <h2>LET’S BUILD YOUR PC.</h2>
            <p>
              Tell us what you play, create or need from your next PC. Your
              enquiry is sent by email and saved in the secure admin portal for
              follow-up.
            </p>
            <div className="showcase-direct">
              <a href={`mailto:${config.contact.email}`}>
                {config.contact.email}
              </a>
              <a href="https://m.me/nextechmt" target="_blank" rel="noreferrer">
                Facebook Messenger ↗
              </a>
              <span>{config.contact.location}</span>
            </div>
          </div>
          <ShowcaseContactForm />
        </section>
      </main>
      <ShowcaseFooter config={config} />
    </div>
  );
}

export { starterSlides };
