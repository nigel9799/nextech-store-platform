"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminContext } from "@/lib/auth/context";
import { createServiceRoleClient } from "@/lib/supabase/admin";
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
  revalidatePath("/gallery-contact");
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
  description: z.string().trim().max(5000),
  price: z.string().trim(),
  oldPrice: z.string().trim(),
  status: z.enum(statuses),
  tag: z.string().trim().max(40),
  existingImageUrls: z.string().trim().max(6000),
  externalImageUrls: z.string().trim().max(4000),
  showInGallery: z.boolean(),
});

const acceptedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function imageFiles(formData: FormData) {
  const coverValue = formData.get("coverImage");
  const cover =
    coverValue instanceof File && coverValue.size > 0 ? coverValue : null;
  const gallery = formData
    .getAll("galleryImages")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const files = cover ? [cover, ...gallery] : gallery;
  if (
    files.some(
      (file) =>
        file.size > 8 * 1024 * 1024 || !acceptedImageTypes.has(file.type),
    )
  )
    return null;
  return { cover, gallery };
}

async function uploadProductImages(
  productId: string,
  tenantId: string,
  files: { cover: File | null; gallery: File[] },
) {
  const service = createServiceRoleClient();
  const uploaded: string[] = [];
  for (const file of [files.cover, ...files.gallery].filter(
    (value): value is File => value !== null,
  )) {
    const extension =
      file.type === "image/jpeg" ? "jpg" : file.type.replace("image/", "");
    const path = `${tenantId}/${productId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await service.storage
      .from("build-images")
      .upload(path, await file.arrayBuffer(), {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });
    if (error) return { urls: uploaded, error };
    const { data } = service.storage.from("build-images").getPublicUrl(path);
    uploaded.push(data.publicUrl);
  }
  return { urls: uploaded, error: null };
}

async function saveProductImage(
  productId: string,
  tenantId: string,
  imageUrls: string[],
  altText: string,
) {
  const supabase = await createClient();
  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("product_id", productId);
  if (deleteError) return deleteError;
  if (!imageUrls.length) return null;
  const { error } = await supabase.from("product_images").insert(
    imageUrls.map((imageUrl, index) => ({
      tenant_id: tenantId,
      product_id: productId,
      storage_path: imageUrl,
      alt_text: `${altText}${index ? ` detail ${index + 1}` : ""}`,
      display_order: index,
      is_primary: index === 0,
      status: "published",
    })),
  );
  return error;
}

function readProduct(formData: FormData) {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId"),
    shortSpec: formData.get("shortSpec"),
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    oldPrice: formData.get("oldPrice") ?? "",
    status: formData.get("status"),
    tag: formData.get("tag") ?? "",
    existingImageUrls: formData.get("existingImageUrls") ?? "",
    externalImageUrls: formData.get("externalImageUrls") ?? "",
    showInGallery: formData.get("showInGallery") === "on",
  });
  const order = parseOptionalOrder(formData.get("displayOrder"));
  const files = imageFiles(formData);
  if (!parsed.success || !files || Number.isNaN(order)) return null;
  const slug = parsed.data.slug || slugify(parsed.data.name);
  const existingImageUrls = parsed.data.existingImageUrls
    ? parsed.data.existingImageUrls
        .split(/\r?\n/)
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
  const externalImageUrls = parsed.data.externalImageUrls
    ? parsed.data.externalImageUrls
        .split(/\r?\n/)
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
  const imageUrls = [...existingImageUrls, ...externalImageUrls];
  if (
    imageUrls.length + (files.cover ? 1 : 0) + files.gallery.length > 12 ||
    imageUrls.some((value) => {
      try {
        return new URL(value).protocol !== "https:" || value.length > 500;
      } catch {
        return true;
      }
    })
  )
    return null;
  const priceMinor = parsed.data.price ? parsePrice(parsed.data.price) : null;
  const oldPriceMinor = parsed.data.oldPrice
    ? parsePrice(parsed.data.oldPrice)
    : null;
  if (
    !slugPattern.test(slug) ||
    (parsed.data.price && priceMinor === null) ||
    (parsed.data.oldPrice && oldPriceMinor === null) ||
    (oldPriceMinor !== null &&
      (priceMinor === null || oldPriceMinor < priceMinor))
  )
    return null;
  return {
    ...parsed.data,
    slug,
    imageUrls,
    priceMinor,
    oldPriceMinor,
    order,
    files,
  };
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
      description: product.description || null,
      price_minor: product.priceMinor,
      old_price_minor: product.oldPriceMinor,
      currency_code: "EUR",
      status: product.status,
      tag: product.tag || null,
      show_in_gallery: product.showInGallery,
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
  const upload = await uploadProductImages(
    data.id,
    context.tenant.id,
    product.files,
  );
  const uploadedCover = product.files.cover ? upload.urls[0] : null;
  const uploadedGallery = product.files.cover
    ? upload.urls.slice(1)
    : upload.urls;
  const imageUrls = uploadedCover
    ? [uploadedCover, ...product.imageUrls, ...uploadedGallery]
    : [...product.imageUrls, ...uploadedGallery];
  const imageError =
    upload.error ??
    (await saveProductImage(
      data.id,
      context.tenant.id,
      imageUrls,
      product.name,
    ));
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
      description: product.description || null,
      price_minor: product.priceMinor,
      old_price_minor: product.oldPriceMinor,
      status: product.status,
      tag: product.tag || null,
      show_in_gallery: product.showInGallery,
      display_order: product.order,
    })
    .eq("id", id.data)
    .eq("tenant_id", context.tenant.id);
  if (error)
    destination("/admin/catalogue/products", "error", catalogueError(error));
  const upload = await uploadProductImages(
    id.data,
    context.tenant.id,
    product.files,
  );
  const uploadedCover = product.files.cover ? upload.urls[0] : null;
  const uploadedGallery = product.files.cover
    ? upload.urls.slice(1)
    : upload.urls;
  const imageUrls = uploadedCover
    ? [uploadedCover, ...product.imageUrls, ...uploadedGallery]
    : [...product.imageUrls, ...uploadedGallery];
  const imageError =
    upload.error ??
    (await saveProductImage(
      id.data,
      context.tenant.id,
      imageUrls,
      product.name,
    ));
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
