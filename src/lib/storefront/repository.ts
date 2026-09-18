import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { resolveRequestTenant } from "@/lib/tenancy/resolve";
import {
  defaultStorefrontCategories,
  defaultStorefrontConfig,
  developmentSeedProducts,
} from "./defaults";
import type {
  StorefrontConfig,
  StorefrontData,
  StorefrontLegalPage,
  StorefrontProduct,
} from "./types";

const publicKinds = new Set(["privacy", "terms", "delivery_returns"]);

function safeLink(value: unknown, fallback: string) {
  return typeof value === "string" && /^(#|\/[a-z0-9/?#=&_.-]*)$/i.test(value)
    ? value
    : fallback;
}

function mergeConfig(value: unknown): StorefrontConfig {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return defaultStorefrontConfig;
  const input = value as Record<string, unknown>;
  const result = structuredClone(defaultStorefrontConfig);
  const copyStrings = (target: Record<string, unknown>, source: unknown) => {
    if (!source || typeof source !== "object" || Array.isArray(source)) return;
    for (const key of Object.keys(target)) {
      const candidate = (source as Record<string, unknown>)[key];
      if (typeof target[key] === "string" && typeof candidate === "string")
        target[key] = candidate;
      if (typeof target[key] === "boolean" && typeof candidate === "boolean")
        target[key] = candidate;
    }
  };
  copyStrings(result as unknown as Record<string, unknown>, input);
  copyStrings(result.navigation, input.navigation);
  copyStrings(result.cart, input.cart);
  copyStrings(result.hero, input.hero);
  copyStrings(result.shop, input.shop);
  copyStrings(result.build, input.build);
  copyStrings(result.contact, input.contact);
  copyStrings(result.footer, input.footer);
  if (
    Array.isArray(
      (input.hero as Record<string, unknown> | undefined)?.trustPoints,
    )
  ) {
    result.hero.trustPoints = (
      (input.hero as Record<string, unknown>).trustPoints as unknown[]
    )
      .filter((point): point is string => typeof point === "string")
      .slice(0, 6);
  }
  if (Array.isArray(input.services)) {
    result.services = input.services
      .filter(
        (service): service is Record<string, unknown> =>
          !!service && typeof service === "object",
      )
      .map((service, index) => ({
        title:
          typeof service.title === "string"
            ? service.title
            : (result.services[index]?.title ?? ""),
        body:
          typeof service.body === "string"
            ? service.body
            : (result.services[index]?.body ?? ""),
        icon:
          typeof service.icon === "string"
            ? service.icon
            : (result.services[index]?.icon ?? "◇"),
      }))
      .slice(0, 3);
  }
  result.logoPath = safeLink(result.logoPath, defaultStorefrontConfig.logoPath);
  result.announcementLink = safeLink(
    result.announcementLink,
    defaultStorefrontConfig.announcementLink,
  );
  if (!/^#[0-9a-f]{6}$/i.test(result.primaryColor))
    result.primaryColor = defaultStorefrontConfig.primaryColor;
  return result;
}

function mapProducts(rows: unknown[]): StorefrontProduct[] {
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const product = row as Record<string, unknown>;
    const category = Array.isArray(product.category)
      ? product.category[0]
      : product.category;
    if (!category || typeof category !== "object") return [];
    const categoryRecord = category as Record<string, unknown>;
    const images = Array.isArray(product.images)
      ? (product.images as Record<string, unknown>[])
      : [];
    const primaryImage = images.find(
      (image) =>
        image.is_primary === true &&
        image.status === "published" &&
        typeof image.storage_path === "string",
    );
    const publishedImages = images
      .filter(
        (image) =>
          image.status === "published" &&
          typeof image.storage_path === "string",
      )
      .sort(
        (left, right) =>
          (typeof left.display_order === "number" ? left.display_order : 0) -
          (typeof right.display_order === "number" ? right.display_order : 0),
      );
    if (
      typeof product.id !== "string" ||
      typeof product.category_id !== "string" ||
      typeof categoryRecord.slug !== "string" ||
      typeof categoryRecord.name !== "string" ||
      typeof product.name !== "string" ||
      typeof product.slug !== "string" ||
      typeof product.sku !== "string" ||
      typeof product.short_spec !== "string" ||
      typeof product.currency_code !== "string" ||
      typeof product.display_order !== "number" ||
      categoryRecord.is_visible === false
    )
      return [];
    return [
      {
        id: product.id,
        categoryId: product.category_id,
        categorySlug: categoryRecord.slug,
        categoryName: categoryRecord.name,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        shortSpec: product.short_spec,
        description:
          typeof product.description === "string" ? product.description : null,
        priceMinor:
          typeof product.price_minor === "number" ? product.price_minor : null,
        oldPriceMinor:
          typeof product.old_price_minor === "number"
            ? product.old_price_minor
            : null,
        currencyCode: product.currency_code,
        tag: typeof product.tag === "string" ? product.tag : null,
        imageUrl:
          primaryImage && typeof primaryImage.storage_path === "string"
            ? primaryImage.storage_path
            : null,
        imageAlt:
          primaryImage && typeof primaryImage.alt_text === "string"
            ? primaryImage.alt_text
            : null,
        imageUrls: publishedImages.map((image) => image.storage_path as string),
        displayOrder: product.display_order,
      },
    ];
  });
}

export async function getStorefrontData(): Promise<StorefrontData> {
  if (
    process.env.VERCEL_ENV === "preview" &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    const previewProducts: StorefrontProduct[] = [
      {
        id: "preview-build-1",
        categoryId: "preview-completed-builds",
        categorySlug: "completed-builds",
        categoryName: "Completed Builds",
        name: "Build 1",
        slug: "build-1",
        sku: "BUILD-001",
        shortSpec:
          "A premium RGB gaming system with meticulous cable management and a clean panoramic finish.",
        description:
          "Use this space to describe the client brief, performance goals and component choices. Add the full CPU, GPU, memory, storage, cooling, case and power-supply specification from the admin portal.",
        priceMinor: null,
        oldPriceMinor: null,
        currencyCode: "EUR",
        tag: "Featured build",
        imageUrl: "/showcase/build-1-main.webp",
        imageAlt: "Nextech Build 1",
        imageUrls: [
          "/showcase/build-1-main.webp",
          "/showcase/build-1-detail.webp",
          "/showcase/build-1-cooling.webp",
        ],
        displayOrder: 0,
      },
      {
        id: "preview-build-2",
        categoryId: "preview-completed-builds",
        categorySlug: "completed-builds",
        categoryName: "Completed Builds",
        name: "Build 2",
        slug: "build-2",
        sku: "BUILD-002",
        shortSpec:
          "A striking complete gaming setup built for immersive performance and a bold RGB aesthetic.",
        description:
          "Use this area for the complete build story and detailed specifications. Pricing can remain blank when the system is displayed purely as previous work.",
        priceMinor: null,
        oldPriceMinor: null,
        currencyCode: "EUR",
        tag: "Completed setup",
        imageUrl: "/showcase/build-2-setup.webp",
        imageAlt: "Nextech Build 2 gaming setup",
        imageUrls: ["/showcase/build-2-setup.webp"],
        displayOrder: 1,
      },
    ];
    return {
      tenant: {
        id: "preview",
        slug: "nextech",
        businessName: "Nextech Malta",
        hostname: process.env.VERCEL_URL ?? "preview.vercel.app",
      },
      config: defaultStorefrontConfig,
      categories: [],
      products: previewProducts,
      legalPages: [],
    };
  }
  const tenant = await resolveRequestTenant();
  const service = createServiceRoleClient();
  const [settingsResult, categoriesResult, initialProductsResult, legalResult] =
    await Promise.all([
      service
        .from("site_settings")
        .select("settings")
        .eq("tenant_id", tenant.id)
        .maybeSingle(),
      service
        .from("product_categories")
        .select("id, slug, name, display_order")
        .eq("tenant_id", tenant.id)
        .eq("is_visible", true)
        .order("display_order"),
      service
        .from("products")
        .select(
          "id, category_id, slug, name, sku, short_spec, description, price_minor, old_price_minor, currency_code, tag, display_order, category:product_categories!inner(slug, name, is_visible), images:product_images(storage_path, alt_text, display_order, is_primary, status)",
        )
        .eq("tenant_id", tenant.id)
        .eq("status", "live")
        .order("display_order"),
      service
        .from("legal_pages")
        .select("kind, title, body")
        .eq("tenant_id", tenant.id)
        .eq("is_published", true),
    ]);
  let productRows: unknown[] = initialProductsResult.data ?? [];
  let productError = initialProductsResult.error;
  if (
    productError?.code === "42703" &&
    productError.message.includes("description")
  ) {
    const legacyProductsResult = await service
      .from("products")
      .select(
        "id, category_id, slug, name, sku, short_spec, price_minor, old_price_minor, currency_code, tag, display_order, category:product_categories!inner(slug, name, is_visible), images:product_images(storage_path, alt_text, display_order, is_primary, status)",
      )
      .eq("tenant_id", tenant.id)
      .eq("status", "live")
      .order("display_order");
    productRows = legacyProductsResult.data ?? [];
    productError = legacyProductsResult.error;
  }
  const firstError =
    [settingsResult, categoriesResult, legalResult].find(
      (result) => result.error,
    )?.error ?? productError;
  if (firstError)
    throw new Error(
      `Storefront data could not be loaded: ${firstError.message}`,
    );

  const categories = categoriesResult.data?.length
    ? [
        { ...defaultStorefrontCategories[0], id: `all-${tenant.id}` },
        ...(categoriesResult.data ?? []).map((category) => ({
          id: category.id,
          slug: category.slug,
          name: category.name,
          displayOrder: category.display_order,
        })),
      ]
    : defaultStorefrontCategories;
  const mappedProducts = mapProducts(productRows);
  const config = mergeConfig(settingsResult.data?.settings);
  const legalPages: StorefrontLegalPage[] = (legalResult.data ?? []).flatMap(
    (page) => {
      if (
        !publicKinds.has(page.kind) ||
        typeof page.title !== "string" ||
        typeof page.body !== "string"
      )
        return [];
      return [
        {
          kind: page.kind as StorefrontLegalPage["kind"],
          title: page.title,
          body: page.body,
        },
      ];
    },
  );
  const isDevelopment = ["development", "test"].includes(
    process.env.APP_ENV ?? "",
  );
  return {
    tenant,
    config,
    categories,
    products:
      mappedProducts.length || !isDevelopment
        ? mappedProducts
        : developmentSeedProducts,
    legalPages,
  };
}

export async function getLegalPage(kind: StorefrontLegalPage["kind"]) {
  const data = await getStorefrontData();
  return (
    data.legalPages.find((page) => page.kind === kind) ?? {
      kind,
      title:
        kind === "delivery_returns"
          ? "Delivery & Returns"
          : kind === "privacy"
            ? "Privacy Policy"
            : "Terms & Conditions",
      body: "This development placeholder must be replaced and reviewed by a qualified professional before launch.",
    }
  );
}
