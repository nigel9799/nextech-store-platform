import {
  deleteGalleryImageAction,
  updateGalleryImageAction,
  uploadGalleryImagesAction,
} from "@/app/admin/gallery/actions";
import { GalleryUploadForm } from "@/components/admin/gallery-upload-form";
import { requireAdminContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

const notices: Record<string, string> = {
  uploaded: "Images uploaded to the public Gallery.",
  updated: "Gallery image updated.",
  deleted: "Gallery image removed.",
};

const errors: Record<string, string> = {
  invalid: "Check the selected files and fields, then try again.",
  "upload-failed": "One of the images could not be uploaded.",
  "save-failed": "The Gallery change could not be saved.",
};

export default async function AdminGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const context = await requireAdminContext("manage_catalogue");
  const query = await searchParams;
  const supabase = await createClient();
  const { data: images } = await supabase
    .from("gallery_images")
    .select(
      "id, storage_path, title, alt_text, display_order, status, source_product_id",
    )
    .eq("tenant_id", context.tenant.id)
    .order("display_order");

  return (
    <>
      <div className="admin-heading">
        <p className="admin-eyebrow">Website media</p>
        <h1>GALLERY</h1>
        <p>
          Upload standalone photos here. Gallery images are managed separately
          from build case studies.
        </p>
      </div>
      {query.notice && notices[query.notice] ? (
        <p className="form-notice" role="status">
          {notices[query.notice]}
        </p>
      ) : null}
      {query.error && errors[query.error] ? (
        <p className="form-notice form-notice-error" role="alert">
          {errors[query.error]}
        </p>
      ) : null}
      <section className="admin-panel">
        <h2>UPLOAD IMAGES</h2>
        <GalleryUploadForm action={uploadGalleryImagesAction} />
      </section>
      <section className="admin-panel admin-gallery-manager">
        <div className="admin-heading-row">
          <div>
            <h2>MANAGE GALLERY</h2>
            <p>Change captions, visibility and order independently.</p>
          </div>
          <strong>{images?.length ?? 0} images</strong>
        </div>
        <div className="admin-gallery-grid">
          {(images ?? []).map((image) => (
            <article className="admin-gallery-card" key={image.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.storage_path} alt={image.alt_text} />
              <form
                className="admin-form admin-editor"
                action={updateGalleryImageAction}
              >
                <input type="hidden" name="id" value={image.id} />
                <label>
                  Title <span>Optional</span>
                  <input
                    name="title"
                    maxLength={160}
                    defaultValue={image.title ?? ""}
                  />
                </label>
                <label>
                  Alt text <span>Required</span>
                  <input
                    name="altText"
                    required
                    maxLength={240}
                    defaultValue={image.alt_text}
                  />
                </label>
                <div className="admin-form-grid">
                  <label>
                    Order <span>Required</span>
                    <input
                      name="displayOrder"
                      type="number"
                      min="0"
                      required
                      defaultValue={image.display_order}
                    />
                  </label>
                  <label>
                    Visibility <span>Required</span>
                    <select name="status" defaultValue={image.status}>
                      <option value="published">Published</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </label>
                </div>
                <div className="admin-form-actions">
                  <button className="admin-button" type="submit">
                    Save image
                  </button>
                </div>
              </form>
              <form action={deleteGalleryImageAction}>
                <input type="hidden" name="id" value={image.id} />
                <button className="admin-text-button danger" type="submit">
                  Delete from Gallery
                </button>
              </form>
            </article>
          ))}
          {!images?.length ? (
            <div className="admin-image-empty">
              No standalone Gallery images yet.
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
