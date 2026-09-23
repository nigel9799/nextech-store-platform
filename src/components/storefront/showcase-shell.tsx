"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  StorefrontConfig,
  StorefrontProduct,
} from "@/lib/storefront/types";
import { ShowcaseContactForm } from "./showcase-contact-form";
import { MessengerIcon } from "./messenger-icon";

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
      {config.announcementEnabled ? (
        <div className="storefront-announcement" role="status">
          <span aria-hidden="true">●</span>
          {config.announcementText}
          <Link href="/#prebuilds">VIEW BUILDS</Link>
        </div>
      ) : null}
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
          <MessengerIcon />
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
          {config.contact.phoneTwo ? (
            <a href={`tel:${config.contact.phoneTwo.replace(/\s/g, "")}`}>
              {config.contact.phoneTwo}
            </a>
          ) : null}
          <a href="https://m.me/nextechmt" target="_blank" rel="noreferrer">
            <MessengerIcon />
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
  const mediaTrack = useRef<HTMLDivElement>(null);
  const images = useMemo(() => {
    const saved = [product.imageUrl, ...product.imageUrls].filter(
      (value): value is string => Boolean(value),
    );
    const unique = [...new Set(saved)];
    const testImages = [
      "/showcase/demo-cyan-pc.webp",
      "/showcase/demo-white-pc.webp",
      "/showcase/build-1-cooling.webp",
    ];
    for (const image of testImages) {
      if (unique.length >= 4) break;
      if (!unique.includes(image)) unique.push(image);
    }
    return unique.length ? unique : ["/showcase/build-1-main.webp"];
  }, [product.imageUrl, product.imageUrls]);

  function moveMedia(direction: -1 | 1) {
    const image = mediaTrack.current?.querySelector<HTMLElement>("img");
    mediaTrack.current?.scrollBy({
      left: direction * ((image?.offsetWidth ?? 420) + 10),
      behavior: "smooth",
    });
  }

  return (
    <article className="showcase-build-card">
      <div className="showcase-build-image">
        <div className="showcase-build-media-track" ref={mediaTrack}>
          {images.map((src, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${src}-${index}`}
              src={src}
              alt={
                index === 0
                  ? (product.imageAlt ?? product.name)
                  : `${product.name} image ${index + 1}`
              }
            />
          ))}
        </div>
        {images.length > 1 ? (
          <div className="showcase-build-media-controls">
            <button
              type="button"
              onClick={() => moveMedia(-1)}
              aria-label={`Previous image for ${product.name}`}
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => moveMedia(1)}
              aria-label={`Next image for ${product.name}`}
            >
              →
            </button>
          </div>
        ) : null}
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
          <Link href={`/builds/${product.slug}`}>View build →</Link>
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
    const isPreview = products.some((product) =>
      product.id.startsWith("preview-"),
    );
    const productSlides = isPreview
      ? products.flatMap((product) =>
          (product.imageUrls.length
            ? product.imageUrls
            : [product.imageUrl ?? "/showcase/build-1-main.webp"]
          ).map((src, index) => ({
            src,
            alt: `${product.name} photo ${index + 1}`,
            name: product.name,
            slug: product.slug,
            label: index ? `Detail ${index + 1}` : (product.tag ?? product.sku),
          })),
        )
      : products.map((product) => ({
          src:
            product.imageUrl ??
            product.imageUrls[0] ??
            "/showcase/build-1-main.webp",
          alt: product.imageAlt ?? product.name,
          name: product.name,
          slug: product.slug,
          label: product.tag ?? product.sku,
        }));
    if (isPreview && productSlides.length < 5 && productSlides.length) {
      productSlides.push({
        ...productSlides[0],
        label: "Featured angle",
      });
    }
    return productSlides.length
      ? productSlides
      : starterSlides.map((slide, index) => ({
          ...slide,
          name: `Build ${index + 1}`,
          slug: "",
          label: "Completed build",
        }));
  }, [products]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % slides.length),
      4200,
    );
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

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
            onMouseLeave={() => setPaused(false)}
          >
            <div className="showcase-carousel-stage">
              {slides.map((slide, index) => {
                const directOffset = index - active;
                const wrappedOffset =
                  Math.abs(directOffset) > slides.length / 2
                    ? directOffset - Math.sign(directOffset) * slides.length
                    : directOffset;
                return (
                  <article
                    key={`${slide.src}-${index}`}
                    className={`showcase-carousel-panel${index === active ? " is-active" : ""}`}
                    style={
                      {
                        "--card-offset": wrappedOffset,
                        "--card-distance": Math.abs(wrappedOffset),
                      } as React.CSSProperties
                    }
                    onMouseEnter={() => {
                      setActive(index);
                      setPaused(true);
                    }}
                    onFocus={() => {
                      setActive(index);
                      setPaused(true);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slide.src} alt={slide.alt} />
                    <div className="showcase-carousel-panel-copy">
                      <small>{slide.label}</small>
                      <strong>{slide.name}</strong>
                      {slide.slug ? (
                        <Link href={`/builds/${slide.slug}`}>View build →</Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="showcase-carousel-controls">
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
              <span>
                {String(active + 1).padStart(2, "0")} /{" "}
                {String(slides.length).padStart(2, "0")}
              </span>
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
              <a href={`tel:${config.contact.phoneOne.replace(/\s/g, "")}`}>
                {config.contact.phoneOne}
              </a>
              {config.contact.phoneTwo ? (
                <a href={`tel:${config.contact.phoneTwo.replace(/\s/g, "")}`}>
                  {config.contact.phoneTwo}
                </a>
              ) : null}
              <a href="https://m.me/nextechmt" target="_blank" rel="noreferrer">
                <MessengerIcon />
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
