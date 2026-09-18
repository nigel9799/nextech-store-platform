import Image from "next/image";
import { ShowcaseContactForm } from "@/components/storefront/showcase-contact-form";
import {
  ShowcaseFooter,
  ShowcaseHeader,
  starterSlides,
} from "@/components/storefront/showcase-shell";
import { getStorefrontData } from "@/lib/storefront/repository";

export const dynamic = "force-dynamic";

export default async function GalleryContactPage() {
  const storefront = await getStorefrontData();
  const gallery = storefront.products.flatMap((product) =>
    product.imageUrls.map((src, index) => ({
      src,
      alt: `${product.name} photo ${index + 1}`,
      name: product.name,
    })),
  );
  const images = gallery.length
    ? gallery
    : starterSlides.map((image, index) => ({
        ...image,
        name: index < 3 ? "Build 1" : "Build 2",
      }));

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
        <section className="showcase-page-hero">
          <p className="showcase-kicker">NEXTECH / COMPLETED WORK</p>
          <h1>GALLERY & CONTACT.</h1>
          <p>
            See the detail behind our completed builds, then tell us what you
            want your next PC to achieve.
          </p>
        </section>
        <section className="showcase-gallery" id="gallery">
          {images.map((image, index) => (
            <figure
              key={`${image.src}-${index}`}
              className={index % 5 === 0 ? "wide" : ""}
            >
              {image.src.startsWith("/") ? (
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 700px) 100vw, 50vw"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image.src} alt={image.alt} />
              )}
              <figcaption>
                <span>{image.name}</span>
                <small>{String(index + 1).padStart(2, "0")}</small>
              </figcaption>
            </figure>
          ))}
        </section>
        <section className="showcase-contact" id="contact">
          <div className="showcase-contact-copy">
            <p className="showcase-kicker">LET’S TALK</p>
            <h2>START YOUR NEXT BUILD.</h2>
            <p>
              Send your requirements through the form. Nextech receives the
              message by email and it is saved in the secure admin portal for
              follow-up.
            </p>
            <div className="showcase-direct">
              <a href={`mailto:${storefront.config.contact.email}`}>
                {storefront.config.contact.email}
              </a>
              <a href="https://m.me/nextechmt" target="_blank" rel="noreferrer">
                Facebook Messenger ↗
              </a>
              <span>{storefront.config.contact.location}</span>
            </div>
          </div>
          <ShowcaseContactForm />
        </section>
      </main>
      <ShowcaseFooter config={storefront.config} />
    </div>
  );
}
