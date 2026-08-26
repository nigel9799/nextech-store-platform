import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { getStorefrontData } from "@/lib/storefront/repository";

export const dynamic = "force-dynamic";

export default async function StorefrontPage() {
  const storefront = await getStorefrontData();
  return (
    <StorefrontShell
      config={storefront.config}
      categories={storefront.categories}
      products={storefront.products}
    />
  );
}
