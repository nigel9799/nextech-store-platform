"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  StorefrontCategory,
  StorefrontConfig,
  StorefrontProduct,
} from "@/lib/storefront/types";

type StorefrontShellProps = {
  config: StorefrontConfig;
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
};

const categoryIcons: Record<string, string> = {
  "prebuilt-pcs": "▥",
  motherboards: "◈",
  "graphic-cards": "▰",
  processors: "◇",
  rams: "▦",
  storage: "▤",
  cooling: "✣",
  cases: "▥",
  peripherals: "⌨",
};

function formatPrice(minor: number, currencyCode: string) {
  return new Intl.NumberFormat("en-MT", {
    style: "currency",
    currency: currencyCode,
  }).format(minor / 100);
}

function ProductVisual({ categorySlug }: { categorySlug: string }) {
  const visual = categorySlug.includes("graphic")
    ? "gpu"
    : categorySlug.includes("processor") || categorySlug.includes("mother")
      ? "cpu"
      : categorySlug.includes("peripheral")
        ? "keys"
        : categorySlug.includes("cool")
          ? "cool"
          : categorySlug.includes("case") || categorySlug.includes("prebuilt")
            ? "pc"
            : "screen";
  const symbols: Record<string, string> = {
    pc: "▥",
    gpu: "▰",
    cpu: "◇",
    keys: "⌨",
    cool: "✣",
    screen: "▣",
  };
  return (
    <span className={`product-visual product-visual-${visual}`}>
      {symbols[visual]}
    </span>
  );
}

export function StorefrontShell({
  config,
  categories,
  products,
}: StorefrontShellProps) {
  const [activeCategory, setActiveCategory] = useState("all-products");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<StorefrontProduct[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [contactNotice, setContactNotice] = useState("");

  useEffect(() => {
    if (!cartOpen && !menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCartOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cartOpen, menuOpen]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const inCategory =
        activeCategory === "all-products" ||
        product.categorySlug === activeCategory;
      const searchable = `${product.name} ${product.shortSpec}`.toLowerCase();
      return (
        inCategory && (!normalizedQuery || searchable.includes(normalizedQuery))
      );
    });
  }, [activeCategory, products, query]);

  const cartTotal = cart.reduce((sum, product) => sum + product.priceMinor, 0);
  const selectedCategory = categories.find(
    (category) => category.slug === activeCategory,
  );

  function chooseCategory(slug: string) {
    setActiveCategory(slug);
    setMenuOpen(false);
    requestAnimationFrame(() =>
      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }),
    );
  }

  function addToCart(product: StorefrontProduct) {
    setCart((current) => [...current, product]);
    setNotice(`${product.name} added to cart`);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function removeFromCart(index: number) {
    setCart((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <main
      className="storefront-shell"
      style={
        { "--storefront-primary": config.primaryColor } as React.CSSProperties
      }
    >
      {config.announcementEnabled ? (
        <div className="storefront-announcement" role="status">
          <span aria-hidden="true">●</span>
          {config.announcementText}
          <a href={config.announcementLink}>{config.announcementButton}</a>
        </div>
      ) : null}

      <header className="storefront-header">
        <Link
          className="storefront-brand"
          href="#top"
          aria-label={`${config.brandName} home`}
        >
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
          <a href="#shop" onClick={() => setMenuOpen(false)}>
            {config.navigation.shop}
          </a>
          <a href="#shop" onClick={() => chooseCategory("prebuilt-pcs")}>
            {config.navigation.prebuilt}
          </a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>
            {config.navigation.contact}
          </a>
        </nav>
        <button
          className="storefront-cart-button"
          type="button"
          aria-label={`Open cart, ${cart.length} items`}
          onClick={() => setCartOpen(true)}
        >
          {config.cart.label} <span aria-hidden="true">{cart.length}</span>
        </button>
      </header>

      <section
        className="storefront-hero"
        id="top"
        aria-labelledby="hero-title"
      >
        <div className="storefront-hero-copy">
          <p className="storefront-eyebrow">
            <i aria-hidden="true" />
            {config.hero.eyebrow}
          </p>
          <h1 id="hero-title">
            {config.hero.lineOne}
            <br />
            <em>{config.hero.accent}</em> {config.hero.lineTwo}
          </h1>
          <p className="storefront-hero-text">{config.hero.body}</p>
          <div className="storefront-hero-actions">
            <a className="storefront-primary-button" href="#shop">
              {config.hero.primaryButton} <b aria-hidden="true">→</b>
            </a>
            <a className="storefront-secondary-button" href="#contact-form">
              {config.hero.secondaryButton}
            </a>
          </div>
          <div className="storefront-trust" aria-label="Nextech benefits">
            {config.hero.trustPoints.map((point) => (
              <span key={point}>✓ {point}</span>
            ))}
          </div>
        </div>
        <div className="storefront-hero-visual" aria-hidden="true">
          <div className="storefront-grid-lines" />
          <div className="storefront-orb" />
          <div className="storefront-tower">
            <div className="storefront-fan fan-one" />
            <div className="storefront-fan fan-two" />
            <div className="storefront-fan fan-three" />
            <span>{config.brandName.toUpperCase()}</span>
          </div>
          <div className="storefront-spec-card">
            <small>{config.hero.cardLabel}</small>
            <strong>{config.hero.cardTitle}</strong>
            <span>{config.hero.cardLink}</span>
          </div>
        </div>
      </section>

      <div
        className="storefront-category-shortcuts"
        aria-label="Featured product types"
      >
        {categories.slice(1, 6).map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => chooseCategory(category.slug)}
          >
            <span aria-hidden="true">
              {categoryIcons[category.slug] ?? "◇"}
            </span>
            {category.name}
          </button>
        ))}
      </div>

      <section
        className="storefront-shop"
        id="shop"
        aria-labelledby="shop-title"
      >
        <div className="storefront-section-heading">
          <div>
            <p className="storefront-eyebrow">
              <i aria-hidden="true" />
              {config.shop.eyebrow}
            </p>
            <h2 id="shop-title">{config.shop.heading}</h2>
          </div>
          <a href="#shop">{config.shop.viewAll}</a>
        </div>
        <div className="storefront-shop-layout">
          <aside
            className="storefront-category-menu"
            aria-label={config.shop.typesLabel}
          >
            <small>{config.shop.typesLabel}</small>
            {categories.map((category) => (
              <button
                className={activeCategory === category.slug ? "is-active" : ""}
                key={category.id}
                type="button"
                aria-pressed={activeCategory === category.slug}
                onClick={() => setActiveCategory(category.slug)}
              >
                <span aria-hidden="true">
                  {activeCategory === category.slug ? "→" : ""}
                </span>
                {category.name}
                <b>
                  {category.slug === "all-products"
                    ? products.length
                    : products.filter(
                        (product) => product.categorySlug === category.slug,
                      ).length}
                </b>
              </button>
            ))}
          </aside>
          <div className="storefront-product-area">
            <div className="storefront-product-toolbar">
              <div>
                <b>{selectedCategory?.name ?? "All products"}</b>
                <span>{visibleProducts.length} products</span>
              </div>
              <label className="storefront-search">
                <span aria-hidden="true">⌕</span>
                <span className="sr-only">Search products</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={config.shop.searchPlaceholder}
                />
              </label>
            </div>
            <div className="storefront-product-rail" aria-live="polite">
              {visibleProducts.map((product) => (
                <article className="storefront-product-card" key={product.id}>
                  <div className="storefront-product-art">
                    {product.tag ? (
                      <span className="storefront-product-tag">
                        {product.tag}
                      </span>
                    ) : null}
                    <button type="button" aria-label={`Save ${product.name}`}>
                      ♡
                    </button>
                    <ProductVisual categorySlug={product.categorySlug} />
                    <small>
                      NEXTECH / {product.categoryName.toUpperCase()}
                    </small>
                  </div>
                  <div className="storefront-product-info">
                    <p>{product.categoryName}</p>
                    <h3>{product.name}</h3>
                    <span className="storefront-product-spec">
                      {product.shortSpec}
                    </span>
                    <div className="storefront-price">
                      <b>
                        {formatPrice(product.priceMinor, product.currencyCode)}
                      </b>
                      {product.oldPriceMinor ? (
                        <del>
                          {formatPrice(
                            product.oldPriceMinor,
                            product.currencyCode,
                          )}
                        </del>
                      ) : null}
                    </div>
                    <button type="button" onClick={() => addToCart(product)}>
                      {config.shop.addButton} <b aria-hidden="true">＋</b>
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {visibleProducts.length > 3 ? (
              <p className="storefront-scroll-hint">
                {config.shop.scrollHint} <span aria-hidden="true">→</span>
              </p>
            ) : null}
            {visibleProducts.length === 0 ? (
              <div className="storefront-empty">
                No products match your search.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section
        className="storefront-build"
        id="build"
        aria-labelledby="build-title"
      >
        <div className="storefront-build-graphic" aria-hidden="true">
          <div className="storefront-blueprint">
            CPU
            <br />
            GPU　RAM
            <br />
            SSD　PSU
          </div>
        </div>
        <div className="storefront-build-copy">
          <p className="storefront-eyebrow">
            <i aria-hidden="true" />
            {config.build.eyebrow}
          </p>
          <h2 id="build-title">
            {config.build.headingOne}
            <br />
            {config.build.headingTwo}
          </h2>
          <p>{config.build.body}</p>
          <div className="storefront-build-steps">
            {config.build.steps.map((step, index) => (
              <span key={step}>
                <b>0{index + 1}</b>
                {step}
              </span>
            ))}
          </div>
          <a className="storefront-primary-button" href="#contact-form">
            {config.build.button} <b aria-hidden="true">→</b>
          </a>
        </div>
      </section>

      <section className="storefront-services" aria-label="Nextech services">
        {config.services.map((service) => (
          <article key={service.title}>
            <b aria-hidden="true">{service.icon}</b>
            <h3>{service.title}</h3>
            <p>{service.body}</p>
          </article>
        ))}
      </section>

      <section
        className="storefront-contact"
        id="contact-form"
        aria-labelledby="contact-title"
      >
        <div className="storefront-contact-intro">
          <p className="storefront-eyebrow">
            <i aria-hidden="true" />
            {config.contact.eyebrow}
          </p>
          <h2 id="contact-title">
            {config.contact.headingOne}
            <br />
            {config.contact.headingTwo}
          </h2>
          <p>{config.contact.body}</p>
          <div className="storefront-contact-direct">
            <small>{config.contact.directLabel}</small>
            <a href={`mailto:${config.contact.email}`}>
              {config.contact.email}
            </a>
            <a href={`tel:${config.contact.phoneOne.replace(/\s/g, "")}`}>
              {config.contact.phoneOne}
            </a>
            <a href={`tel:${config.contact.phoneTwo.replace(/\s/g, "")}`}>
              {config.contact.phoneTwo}
            </a>
          </div>
        </div>
        <form
          className="storefront-contact-form"
          onSubmit={(event) => {
            event.preventDefault();
            setContactNotice(
              "Contact submissions will be enabled in Milestone 5.",
            );
          }}
          aria-describedby="storefront-contact-helper"
        >
          <div className="storefront-form-row">
            <label>
              Your name *
              <input name="name" required placeholder="Name and surname" />
            </label>
            <label>
              Email address *
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
              />
            </label>
          </div>
          <div className="storefront-form-row">
            <label>
              Phone number
              <input name="phone" type="tel" placeholder="+356" />
            </label>
            <label>
              What can we help with? *
              <select name="interest" required defaultValue="">
                <option value="" disabled>
                  Select an option
                </option>
                <option>Custom PC build</option>
                <option>Product or part enquiry</option>
                <option>Upgrade or repair advice</option>
                <option>Order support</option>
                <option>Other</option>
              </select>
            </label>
          </div>
          <label>
            Approximate budget
            <select name="budget" defaultValue="">
              <option value="">Select a budget (optional)</option>
              <option>Under €800</option>
              <option>€800–€1,200</option>
              <option>€1,200–€1,800</option>
              <option>€1,800–€2,500</option>
              <option>Over €2,500</option>
            </select>
          </label>
          <label>
            Tell us what you need *
            <textarea
              name="message"
              required
              rows={6}
              placeholder="For a custom PC, tell us the games, software or work you will use it for…"
            />
          </label>
          <button type="submit">
            {config.contact.submitButton} <b aria-hidden="true">→</b>
          </button>
          <small id="storefront-contact-helper">
            {config.contact.helperText}
          </small>
          {contactNotice ? (
            <p className="storefront-form-notice" role="status">
              {contactNotice}
            </p>
          ) : null}
        </form>
      </section>

      <footer className="storefront-footer" id="contact">
        <div className="storefront-footer-main">
          <Image
            src={config.logoPath}
            alt={config.brandName}
            width={145}
            height={76}
          />
          <div>
            <small>{config.footer.callLabel}</small>
            <a href={`tel:${config.contact.phoneOne.replace(/\s/g, "")}`}>
              {config.contact.phoneOne}
            </a>
            <a href={`tel:${config.contact.phoneTwo.replace(/\s/g, "")}`}>
              {config.contact.phoneTwo}
            </a>
          </div>
          <div>
            <small>{config.footer.emailLabel}</small>
            <a href={`mailto:${config.contact.email}`}>
              {config.contact.email}
            </a>
            <span>{config.contact.location}</span>
          </div>
          <div>
            <small>{config.footer.linksLabel}</small>
            <a href="#shop">{config.footer.shopLink}</a>
            <a href="#contact-form">{config.footer.buildLink}</a>
            <Link href="/admin">{config.footer.adminLink}</Link>
          </div>
        </div>
        <div className="storefront-footer-bottom">
          <span>{config.footer.copyright}</span>
          <span>
            <Link href="/privacy">{config.footer.privacyLabel}</Link> ·{" "}
            <Link href="/terms">{config.footer.termsLabel}</Link> ·{" "}
            <Link href="/delivery-returns">{config.footer.deliveryLabel}</Link>
          </span>
        </div>
      </footer>

      {notice ? (
        <div className="storefront-toast" role="status">
          ✓ {notice}
        </div>
      ) : null}
      {cartOpen ? (
        <button
          className="storefront-overlay"
          type="button"
          aria-label="Close cart"
          onClick={() => setCartOpen(false)}
        />
      ) : null}
      <aside
        className={`storefront-cart-drawer${cartOpen ? " is-open" : ""}`}
        aria-hidden={!cartOpen}
        aria-label="Cart"
        role="dialog"
        aria-modal={cartOpen}
      >
        <div className="storefront-drawer-heading">
          <h2>
            {config.cart.label} <span>{cart.length}</span>
          </h2>
          <button
            type="button"
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
          >
            ×
          </button>
        </div>
        {cart.length === 0 ? (
          <div className="storefront-cart-empty">
            <b>{config.cart.emptyTitle}</b>
            <p>{config.cart.emptyBody}</p>
            <button type="button" onClick={() => setCartOpen(false)}>
              {config.cart.continueLabel}
            </button>
          </div>
        ) : (
          <>
            <div className="storefront-cart-items">
              {cart.map((product, index) => (
                <div
                  className="storefront-cart-item"
                  key={`${product.id}-${index}`}
                >
                  <ProductVisual categorySlug={product.categorySlug} />
                  <div>
                    <b>{product.name}</b>
                    <span>
                      {formatPrice(product.priceMinor, product.currencyCode)}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${product.name}`}
                    onClick={() => removeFromCart(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="storefront-cart-total">
              <p>
                <span>Estimated total</span>
                <b>{formatPrice(cartTotal, cart[0].currencyCode)}</b>
              </p>
              <small>
                No payment is taken online. Cart enquiries will be enabled in
                Milestone 5.
              </small>
              <button type="button" disabled>
                {config.cart.enquiryLabel} →
              </button>
            </div>
          </>
        )}
      </aside>
    </main>
  );
}
