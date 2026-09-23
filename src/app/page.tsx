import { ShowcaseHome } from "@/components/storefront/showcase-shell";
import { getStorefrontData } from "@/lib/storefront/repository";

export const dynamic = "force-dynamic";

export default async function StorefrontPage() {
  const storefront = await getStorefrontData();
  return (
    <ShowcaseHome config={storefront.config} products={storefront.products} />
  );
}
