import Link from "next/link";
import type { ComponentProps } from "react";
import { BuildImageManager } from "./build-image-manager";
import { FormDraftRecovery } from "./form-draft-recovery";
import { NameSlugFields } from "./name-slug-fields";

type Category = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_visible: boolean;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  short_spec: string;
  description: string | null;
  price_minor: number | null;
  old_price_minor: number | null;
  status: "draft" | "live" | "hidden" | "archived";
  tag: string | null;
  show_in_gallery: boolean;
  display_order: number;
  imageUrls?: string[];
};

type FormAction = ComponentProps<"form">["action"];

export const errorMessages: Record<string, string> = {
  invalid: "Check the highlighted information and try again.",
  "invalid-slug":
    "Use only lowercase letters, numbers and single hyphens in the slug.",
  duplicate: "That slug, SKU or display order is already in use.",
  "category-in-use":
    "Move or remove the products in this category before deleting it.",
  "image-failed": "The product saved, but its image URL could not be saved.",
  "gallery-failed":
    "The build saved, but its photos could not be copied to the Gallery.",
  "save-failed": "The change could not be saved. Please try again.",
};

export function CategoryForm({
  action,
  category,
}: {
  action: FormAction;
  category?: Category;
}) {
  return (
    <form className="admin-form admin-editor" action={action}>
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <NameSlugFields
        itemLabel="Category"
        initialName={category?.name}
        initialSlug={category?.slug}
      />
      <label>
        Visibility <span>Required</span>
        <select
          name="visibility"
          defaultValue={category?.is_visible === false ? "hidden" : "visible"}
        >
          <option value="visible">Visible on storefront</option>
          <option value="hidden">Hidden from storefront</option>
        </select>
        <small>
          Hidden categories and their products do not appear publicly.
        </small>
      </label>
      <label>
        Display order <span>{category ? "Required" : "Optional"}</span>
        <input
          name="displayOrder"
          type="number"
          min="0"
          required={Boolean(category)}
          defaultValue={category?.display_order}
          placeholder="Assigned automatically when blank"
        />
        <small>Lower numbers appear first.</small>
      </label>
      <div className="admin-form-actions">
        <button className="admin-button" type="submit">
          {category ? "Save category" : "Create category"}
        </button>
        <Link href="/admin/catalogue/categories">Cancel</Link>
      </div>
    </form>
  );
}

export function ProductForm({
  action,
  categories,
  product,
  preserveDraft = false,
}: {
  action: FormAction;
  categories: Category[];
  product?: Product;
  preserveDraft?: boolean;
}) {
  return (
    <form
      id="product-editor-form"
      className="admin-form admin-editor"
      action={action}
    >
      <FormDraftRecovery
        formId="product-editor-form"
        restore={preserveDraft}
        storageKey="nextech-admin-build-draft"
      />
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <NameSlugFields
        itemLabel="Product"
        initialName={product?.name}
        initialSlug={product?.slug}
      />
      <div className="admin-form-grid">
        <label>
          Build reference <span>Required</span>
          <input
            name="sku"
            required
            maxLength={80}
            defaultValue={product?.sku}
            placeholder="e.g. BUILD-001"
          />
          <small>Unique internal reference for this completed build.</small>
        </label>
        <input
          type="hidden"
          name="categoryId"
          value={product?.category_id ?? categories[0]?.id ?? ""}
        />
      </div>
      <label>
        Short introduction <span>Required</span>
        <input
          name="shortSpec"
          required
          maxLength={240}
          defaultValue={product?.short_spec}
          placeholder="A clean, high-performance gaming build created for smooth 1440p play."
        />
        <small>Shown directly on the completed-build card.</small>
      </label>
      <label>
        Build story and specifications <span>Optional</span>
        <textarea
          name="description"
          maxLength={5000}
          rows={9}
          defaultValue={product?.description ?? ""}
          placeholder={
            "Tell the story behind the build, then list its key components.\n\nCPU:\nGPU:\nMotherboard:\nMemory:\nStorage:\nCooling:\nCase:\nPower supply:"
          }
        />
        <small>
          This is the main article text on the build page. Add the client brief,
          design choices, performance goals and component list.
        </small>
      </label>
      <div className="admin-form-grid">
        <label>
          Price in EUR <span>Optional</span>
          <input
            name="price"
            inputMode="decimal"
            defaultValue={
              typeof product?.price_minor === "number"
                ? (product.price_minor / 100).toFixed(2)
                : ""
            }
            placeholder="129.99"
          />
          <small>Leave blank when the build is showcase-only.</small>
        </label>
        <label>
          Previous price in EUR <span>Optional</span>
          <input
            name="oldPrice"
            inputMode="decimal"
            defaultValue={
              product?.old_price_minor
                ? (product.old_price_minor / 100).toFixed(2)
                : ""
            }
            placeholder="149.99"
          />
          <small>Must be equal to or higher than the current price.</small>
        </label>
      </div>
      <div className="admin-form-grid">
        <label>
          Storefront status <span>Required</span>
          <select name="status" defaultValue={product?.status ?? "draft"}>
            <option value="draft">Draft — admin only</option>
            <option value="live">Live — visible publicly</option>
            <option value="hidden">Hidden — temporarily private</option>
            <option value="archived">Archived — retired</option>
          </select>
        </label>
        <label>
          Showcase tag <span>Optional</span>
          <input
            name="tag"
            maxLength={40}
            defaultValue={product?.tag ?? ""}
            placeholder="e.g. New or In stock"
          />
        </label>
      </div>
      <BuildImageManager initialImages={product?.imageUrls} />
      <label className="admin-check-option">
        <input
          name="addImagesToGallery"
          type="checkbox"
          defaultChecked={false}
        />
        <span>
          <strong>Also add these photos to the public Gallery</strong>
          <small>
            Copies any saved and newly uploaded build photos into the separate
            Gallery. Existing Gallery photos are not duplicated.
          </small>
        </span>
      </label>
      <label>
        Display order <span>{product ? "Required" : "Optional"}</span>
        <input
          name="displayOrder"
          type="number"
          min="0"
          required={Boolean(product)}
          defaultValue={product?.display_order}
          placeholder="Assigned automatically when blank"
        />
        <small>Lower numbers appear first.</small>
      </label>
      <div className="admin-form-actions">
        <button className="admin-button" type="submit">
          {product ? "Save build" : "Create build"}
        </button>
        <Link href="/admin/catalogue/products">Cancel</Link>
      </div>
    </form>
  );
}
