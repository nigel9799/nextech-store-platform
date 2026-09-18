"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const statuses = ["draft", "live", "hidden", "archived"] as const;

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function parseOptionalOrder(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

function parsePrice(value: string) {
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(value.trim())) return null;
  return Math.round(Number(value) * 100);
}

function destination(
  path: string,
  key: "error" | "notice",
  value: string,
): never {
  redirect(`${path}?${key}=${encodeURIComponent(value)}`);
}

function catalogueError(error: { code?: string; message?: string }) {
  if (error.code === "23505") return "duplicate";
  if (error.code === "23503") return "category-in-use";
  if (error.code === "23514") return "invalid";
  return "save-failed";
}

async function nextOrder(
  table: "product_categories" | "products",
  tenantId: string,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from(table)
    .select("display_order")
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.display_order ?? -1) + 1;
}

function refreshCatalogue() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/catalogue/products");
  revalidatePath("/admin/catalogue/categories");
}

const categorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().max(80),
  visibility: z.enum(["visible", "hidden"]),
});

export async function createCategoryAction(formData: FormData) {
  const context = await requireAdminContext("manage_catalogue");
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    visibility: formData.get("visibility"),
  });
  const order = parseOptionalOrder(formData.get("displayOrder"));
  if (!parsed.success || Number.isNaN(order))
    destination("/admin/catalogue/categories/new", "error", "invalid");
  const slug = parsed.data.slug || slugify(parsed.data.name);
  if (!slugPattern.test(slug))
    destination("/admin/catalogue/categories/new", "error", "invalid-slug");

  const supabase = await createClient();
  const { error } = await supabase.from("product_categories").insert({
    tenant_id: context.tenant.id,
    name: parsed.data.name,
    slug,
    is_visible: parsed.data.visibility === "visible",
    display_order:
      order ?? (await nextOrder("product_categories", context.tenant.id)),
  });
  if (error)
    destination(
      "/admin/catalogue/categories/new",
      "error",
      catalogueError(error),
    );
  refreshCatalogue();
  destination("/admin/catalogue/categories", "notice", "created");
}

export async function updateCategoryAction(formData: FormData) {
  const context = await requireAdminContext("manage_catalogue");
  const id = z.string().uuid().safeParse(formData.get("id"));
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    visibility: formData.get("visibility"),
  });
  const order = parseOptionalOrder(formData.get("displayOrder"));
  if (!id.success || !parsed.success || order === null || Number.isNaN(order))
    destination("/admin/catalogue/categories", "error", "invalid");
  const slug = parsed.data.slug || slugify(parsed.data.name);
  if (!slugPattern.test(slug))
    destination("/admin/catalogue/categories", "error", "invalid-slug");
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_categories")
    .update({
      name: parsed.data.name,
      slug,
      is_visible: parsed.data.visibility === "visible",
      display_order: order,
    })
    .eq("id", id.data)
    .eq("tenant_id", context.tenant.id);
  if (error)
    destination("/admin/catalogue/categories", "error", catalogueError(error));
  refreshCatalogue();
  destination("/admin/catalogue/categories", "notice", "updated");
}

export async function deleteCategoryAction(formData: FormData) {
  const context = await requireAdminContext("manage_catalogue");
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success)
    destination("/admin/catalogue/categories", "error", "invalid");
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_categories")
    .delete()
    .eq("id", id.data)
    .eq("tenant_id", context.tenant.id);
  if (error)
    destination("/admin/catalogue/categories", "error", catalogueError(error));
  refreshCatalogue();
  destination("/admin/catalogue/categories", "notice", "deleted");
}

const productSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().max(160),
  sku: z.string().trim().min(1).max(80),
  categoryId: z.string().uuid(),
  shortSpec: z.string().trim().min(1).max(240),
  price: z.string().trim(),
  oldPrice: z.string().trim(),
  status: z.enum(statuses),
  tag: z.string().trim().max(40),
  imageUrl: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .url()
      .regex(/^https:\/\//i)
      .max(500),
  ]),
});

async function saveProductImage(
  productId: string,
  tenantId: string,
  imageUrl: string,
  altText: string,
) {
  const supabase = await createClient();
  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("product_id", productId);
  if (deleteError) return deleteError;
  if (!imageUrl) return null;
  const { error } = await supabase.from("product_images").insert({
    tenant_id: tenantId,
    product_id: productId,
    storage_path: imageUrl,
    alt_text: altText,
    display_order: 0,
    is_primary: true,
    status: "published",
  });
  return error;
}

function readProduct(formData: FormData) {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId"),
    shortSpec: formData.get("shortSpec"),
    price: formData.get("price"),
    oldPrice: formData.get("oldPrice") ?? "",
    status: formData.get("status"),
    tag: formData.get("tag") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
  });
  const order = parseOptionalOrder(formData.get("displayOrder"));
  if (!parsed.success || Number.isNaN(order)) return null;
  const slug = parsed.data.slug || slugify(parsed.data.name);
  const priceMinor = parsePrice(parsed.data.price);
  const oldPriceMinor = parsed.data.oldPrice
    ? parsePrice(parsed.data.oldPrice)
    : null;
  if (
    !slugPattern.test(slug) ||
    priceMinor === null ||
    (parsed.data.oldPrice && oldPriceMinor === null) ||
    (oldPriceMinor !== null && oldPriceMinor < priceMinor)
  )
    return null;
  return { ...parsed.data, slug, priceMinor, oldPriceMinor, order };
}

export async function createProductAction(formData: FormData) {
  const context = await requireAdminContext("manage_catalogue");
  const product = readProduct(formData);
  if (!product)
    destination("/admin/catalogue/products/new", "error", "invalid");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      tenant_id: context.tenant.id,
      category_id: product.categoryId,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      short_spec: product.shortSpec,
      price_minor: product.priceMinor,
      old_price_minor: product.oldPriceMinor,
      currency_code: "EUR",
      status: product.status,
      tag: product.tag || null,
      display_order:
        product.order ?? (await nextOrder("products", context.tenant.id)),
    })
    .select("id")
    .single();
  if (error || !data)
    destination(
      "/admin/catalogue/products/new",
      "error",
      catalogueError(error ?? {}),
    );
  const imageError = await saveProductImage(
    data.id,
    context.tenant.id,
    product.imageUrl,
    product.name,
  );
  if (imageError)
    destination(
      `/admin/catalogue/products/${data.id}/edit`,
      "error",
      "image-failed",
    );
  refreshCatalogue();
  destination("/admin/catalogue/products", "notice", "created");
}

export async function updateProductAction(formData: FormData) {
  const context = await requireAdminContext("manage_catalogue");
  const id = z.string().uuid().safeParse(formData.get("id"));
  const product = readProduct(formData);
  if (!id.success || !product || product.order === null)
    destination("/admin/catalogue/products", "error", "invalid");
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      category_id: product.categoryId,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      short_spec: product.shortSpec,
      price_minor: product.priceMinor,
      old_price_minor: product.oldPriceMinor,
      status: product.status,
      tag: product.tag || null,
      display_order: product.order,
    })
    .eq("id", id.data)
    .eq("tenant_id", context.tenant.id);
  if (error)
    destination("/admin/catalogue/products", "error", catalogueError(error));
  const imageError = await saveProductImage(
    id.data,
    context.tenant.id,
    product.imageUrl,
    product.name,
  );
  if (imageError)
    destination(
      `/admin/catalogue/products/${id.data}/edit`,
      "error",
      "image-failed",
    );
  refreshCatalogue();
  destination("/admin/catalogue/products", "notice", "updated");
}

export async function archiveProductAction(formData: FormData) {
  const context = await requireAdminContext("manage_catalogue");
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) destination("/admin/catalogue/products", "error", "invalid");
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ status: "archived" })
    .eq("id", id.data)
    .eq("tenant_id", context.tenant.id);
  if (error) destination("/admin/catalogue/products", "error", "save-failed");
  refreshCatalogue();
  destination("/admin/catalogue/products", "notice", "archived");
}

export async function deleteProductAction(formData: FormData) {
  const context = await requireAdminContext("manage_catalogue");
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) destination("/admin/catalogue/products", "error", "invalid");
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id.data)
    .eq("tenant_id", context.tenant.id);
  if (error) destination("/admin/catalogue/products", "error", "save-failed");
  refreshCatalogue();
  destination("/admin/catalogue/products", "notice", "deleted");
}

export async function updateSettingsAction(formData: FormData) {
  const context = await requireAdminContext("manage_website");
  const parsed = z
    .object({
      brandName: z.string().trim().min(1).max(80),
      primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i),
      announcementText: z.string().trim().max(160),
      email: z.string().trim().email().max(254),
      notificationEmail: z.string().trim().email().max(254),
      phoneOne: z.string().trim().min(3).max(40),
      phoneTwo: z.string().trim().max(40),
      location: z.string().trim().min(1).max(120),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) destination("/admin/settings", "error", "invalid");
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("site_settings")
    .select("settings")
    .eq("tenant_id", context.tenant.id)
    .maybeSingle();
  const existing =
    current?.settings && typeof current.settings === "object"
      ? (current.settings as Record<string, unknown>)
      : {};
  const existingContact =
    existing.contact && typeof existing.contact === "object"
      ? (existing.contact as Record<string, unknown>)
      : {};
  const settings = {
    ...existing,
    brandName: parsed.data.brandName,
    primaryColor: parsed.data.primaryColor,
    announcementEnabled: formData.get("announcementEnabled") === "on",
    announcementText: parsed.data.announcementText,
    contact: {
      ...existingContact,
      email: parsed.data.email,
      notificationEmail: parsed.data.notificationEmail,
      phoneOne: parsed.data.phoneOne,
      phoneTwo: parsed.data.phoneTwo,
      location: parsed.data.location,
      helperText: "We normally reply within one working day.",
    },
  };
  const { error } = await supabase
    .from("site_settings")
    .upsert({ tenant_id: context.tenant.id, settings });
  if (error) destination("/admin/settings", "error", "save-failed");
  revalidatePath("/");
  revalidatePath("/admin/settings");
  destination("/admin/settings", "notice", "updated");
}
