"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminContext } from "@/lib/auth/context";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const acceptedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function finish(key: "notice" | "error", value: string): never {
  redirect(`/admin/gallery?${key}=${encodeURIComponent(value)}`);
}

function refreshGallery() {
  revalidatePath("/gallery-contact");
  revalidatePath("/admin/gallery");
}

export async function uploadGalleryImagesAction(formData: FormData) {
  const context = await requireAdminContext("manage_catalogue");
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const title = z
    .string()
    .trim()
    .max(160)
    .safeParse(formData.get("title") ?? "");
  const alt = z
    .string()
    .trim()
    .max(200)
    .safeParse(formData.get("altText") ?? "");
  if (
    !files.length ||
    files.length > 30 ||
    !title.success ||
    !alt.success ||
    files.some(
      (file) =>
        file.size > 8 * 1024 * 1024 || !acceptedImageTypes.has(file.type),
    )
  )
    finish("error", "invalid");

  const supabase = await createClient();
  const service = createServiceRoleClient();
  const { data: last } = await supabase
    .from("gallery_images")
    .select("display_order")
    .eq("tenant_id", context.tenant.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const start = (last?.display_order ?? -1) + 1;
  const rows = [];
  for (const [index, file] of files.entries()) {
    const extension =
      file.type === "image/jpeg" ? "jpg" : file.type.replace("image/", "");
    const path = `${context.tenant.id}/gallery/${crypto.randomUUID()}.${extension}`;
    const { error } = await service.storage
      .from("build-images")
      .upload(path, await file.arrayBuffer(), {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });
    if (error) finish("error", "upload-failed");
    const { data } = service.storage.from("build-images").getPublicUrl(path);
    rows.push({
      tenant_id: context.tenant.id,
      storage_path: data.publicUrl,
      title: title.data || null,
      alt_text:
        alt.data || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
      display_order: start + index,
      status: "published",
    });
  }
  const { error } = await supabase.from("gallery_images").insert(rows);
  if (error) finish("error", "save-failed");
  refreshGallery();
  finish("notice", "uploaded");
}

export async function updateGalleryImageAction(formData: FormData) {
  const context = await requireAdminContext("manage_catalogue");
  const parsed = z
    .object({
      id: z.string().uuid(),
      title: z.string().trim().max(160),
      altText: z.string().trim().min(1).max(240),
      displayOrder: z.coerce.number().int().min(0),
      status: z.enum(["published", "hidden"]),
    })
    .safeParse({
      id: formData.get("id"),
      title: formData.get("title") ?? "",
      altText: formData.get("altText"),
      displayOrder: formData.get("displayOrder"),
      status: formData.get("status"),
    });
  if (!parsed.success) finish("error", "invalid");
  const supabase = await createClient();
  const { error } = await supabase
    .from("gallery_images")
    .update({
      title: parsed.data.title || null,
      alt_text: parsed.data.altText,
      display_order: parsed.data.displayOrder,
      status: parsed.data.status,
    })
    .eq("tenant_id", context.tenant.id)
    .eq("id", parsed.data.id);
  if (error) finish("error", "save-failed");
  refreshGallery();
  finish("notice", "updated");
}

export async function deleteGalleryImageAction(formData: FormData) {
  const context = await requireAdminContext("manage_catalogue");
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) finish("error", "invalid");
  const supabase = await createClient();
  const { error } = await supabase
    .from("gallery_images")
    .delete()
    .eq("tenant_id", context.tenant.id)
    .eq("id", id.data);
  if (error) finish("error", "save-failed");
  refreshGallery();
  finish("notice", "deleted");
}
