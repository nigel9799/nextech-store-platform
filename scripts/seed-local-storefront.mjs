import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const output = execFileSync(
  process.execPath,
  ["node_modules/supabase/dist/supabase.js", "status", "-o", "env"],
  { encoding: "utf8" },
);
const local = Object.fromEntries(
  output
    .split(/\r?\n/)
    .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map((match) => [match[1], match[2].replace(/"$/, "")]),
);
const apiUrl = local.API_URL;
const serviceRoleKey = local.SERVICE_ROLE_KEY;
if (!apiUrl || !serviceRoleKey)
  throw new Error("Local Supabase is not running");
const parsedUrl = new URL(apiUrl);
if (!["127.0.0.1", "localhost"].includes(parsedUrl.hostname))
  throw new Error("Storefront seed refuses a non-local Supabase URL");

const service = createClient(apiUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const tenantId = "20000000-0000-4000-8000-000000000100";
const settings = {
  brandName: "Nextech Malta",
  logoPath: "/nextech-logo.png",
  primaryColor: "#2590a4",
};
const categoryNames = [
  "Prebuilt PCs",
  "Motherboards",
  "Graphic Cards",
  "Processors",
  "RAMs",
  "Storage",
  "Cooling",
  "Cases",
  "Peripherals",
];
const products = [
  [
    "NEX Aether RTX 5070",
    "prebuilt-pcs",
    189900,
    204900,
    "Featured",
    "Ryzen 7 · RTX 5070 · 32GB DDR5",
  ],
  [
    "GeForce RTX 5070 12GB",
    "graphic-cards",
    72900,
    null,
    "New",
    "GDDR7 · Triple-fan cooling",
  ],
  [
    "Ryzen 7 9800X3D",
    "processors",
    58900,
    null,
    "Top seller",
    "8 cores · AM5 · Gaming CPU",
  ],
  [
    "NEX Pulse 75 Keyboard",
    "peripherals",
    9990,
    11990,
    "Sale",
    "Hot-swap · Wireless · RGB",
  ],
  [
    "Arctic 360 A-RGB",
    "cooling",
    12900,
    null,
    "In stock",
    "360mm liquid CPU cooler",
  ],
  [
    '27" QHD 180Hz Display',
    "peripherals",
    27900,
    null,
    "Great value",
    "IPS · 1ms · Adaptive Sync",
  ],
  [
    "B650 Gaming WiFi",
    "motherboards",
    18900,
    null,
    "In stock",
    "AM5 · DDR5 · Wi-Fi 6E",
  ],
  [
    "NEX Glide Wireless Mouse",
    "peripherals",
    6490,
    null,
    "New",
    "26K DPI · 59g · Tri-mode",
  ],
  [
    "2TB Gen4 NVMe SSD",
    "storage",
    13400,
    null,
    "In stock",
    "7,400MB/s · PCIe 4.0",
  ],
  [
    '34" Ultrawide 165Hz',
    "peripherals",
    42900,
    null,
    "Featured",
    "WQHD · Curved · USB-C",
  ],
  [
    "NEX Nova RTX 5060 Ti",
    "prebuilt-pcs",
    129900,
    null,
    "Popular",
    "Ryzen 5 · RTX 5060 Ti · 32GB",
  ],
  [
    "Dual Tower Air Cooler",
    "cooling",
    5490,
    null,
    "Great value",
    "6 heatpipes · Dual 120mm fans",
  ],
  [
    "32GB DDR5 6000MHz Kit",
    "rams",
    10900,
    null,
    "In stock",
    "2×16GB · CL30 · EXPO",
  ],
  [
    "NEX Airflow M2 Case",
    "cases",
    8990,
    null,
    "New",
    "Tempered glass · 4 ARGB fans",
  ],
];

const categoryRows = categoryNames.map((name, index) => ({
  tenant_id: tenantId,
  slug: name.toLowerCase().replaceAll(" ", "-"),
  name,
  display_order: index,
  is_visible: true,
}));
const categoryResult = await service
  .from("product_categories")
  .upsert(categoryRows, { onConflict: "tenant_id,slug" })
  .select("id, slug");
if (categoryResult.error) throw categoryResult.error;
const categoryIds = new Map(
  categoryResult.data.map((row) => [row.slug, row.id]),
);
const productRows = products.map(
  ([name, slug, price, oldPrice, tag, shortSpec], index) => ({
    tenant_id: tenantId,
    category_id: categoryIds.get(slug),
    slug: name
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    name,
    sku: `NEX-DEV-${String(index + 1).padStart(3, "0")}`,
    short_spec: shortSpec,
    price_minor: price,
    old_price_minor: oldPrice,
    currency_code: "EUR",
    status: "live",
    tag,
    display_order: index,
  }),
);
const productsResult = await service
  .from("products")
  .upsert(productRows, { onConflict: "tenant_id,sku" });
if (productsResult.error) throw productsResult.error;

for (const row of [{ tenant_id: tenantId, settings }]) {
  const result = await service.from("site_settings").upsert(row);
  if (result.error) throw result.error;
}
const legalRows = [
  [
    "privacy",
    "Privacy Policy",
    "Development placeholder: explain what information you collect, why you collect it, how long it is kept and how customers can contact you about their data.",
  ],
  [
    "terms",
    "Terms & Conditions",
    "Development placeholder: include your terms of sale, quotation validity, availability, warranties, payment arrangements and limitations of liability.",
  ],
  [
    "delivery_returns",
    "Delivery & Returns",
    "Development placeholder: explain delivery areas, timeframes, collection options, return eligibility and the process customers should follow.",
  ],
].map(([kind, title, body]) => ({
  tenant_id: tenantId,
  kind,
  title,
  body,
  is_published: true,
}));
const legalResult = await service
  .from("legal_pages")
  .upsert(legalRows, { onConflict: "tenant_id,kind" });
if (legalResult.error) throw legalResult.error;
console.log(
  "Local storefront seed data is ready (development-only; not production data).",
);
