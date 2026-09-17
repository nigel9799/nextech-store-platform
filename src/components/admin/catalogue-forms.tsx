import Link from "next/link";
import type { ComponentProps } from "react";
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
  price_minor: number;
  old_price_minor: number | null;
  status: "draft" | "live" | "hidden" | "archived";
  tag: string | null;
  display_order: number;
  imageUrl?: string;
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
}: {
  action: FormAction;
  categories: Category[];
  product?: Product;
}) {
  return (
    <form className="admin-form admin-editor" action={action}>
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <NameSlugFields
        itemLabel="Product"
        initialName={product?.name}
        initialSlug={product?.slug}
      />
      <div className="admin-form-grid">
        <label>
          SKU <span>Required</span>
          <input
            name="sku"
            required
            maxLength={80}
            defaultValue={product?.sku}
            placeholder="e.g. GPU-RTX5070TI-16GB"
          />
          <small>Unique internal stock reference.</small>
        </label>
        <label>
          Category <span>Required</span>
          <select
            name="categoryId"
            required
            defaultValue={product?.category_id ?? ""}
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Short specification <span>Required</span>
        <input
          name="shortSpec"
          required
          maxLength={240}
          defaultValue={product?.short_spec}
          placeholder="e.g. 8 cores · AM5 · Gaming CPU"
        />
        <small>Shown directly on the storefront product card.</small>
      </label>
      <div className="admin-form-grid">
        <label>
          Price in EUR <span>Required</span>
          <input
            name="price"
            required
            inputMode="decimal"
            defaultValue={product ? (product.price_minor / 100).toFixed(2) : ""}
            placeholder="129.99"
          />
          <small>Final VAT-inclusive retail price.</small>
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
          Product tag <span>Optional</span>
          <input
            name="tag"
            maxLength={40}
            defaultValue={product?.tag ?? ""}
            placeholder="e.g. New or In stock"
          />
        </label>
      </div>
      <label>
        Product image URL <span>Optional</span>
        <input
          name="imageUrl"
          type="url"
          maxLength={500}
          defaultValue={product?.imageUrl ?? ""}
          placeholder="https://supplier.example/product.jpg"
        />
        <small>
          Use a direct HTTPS image link. A branded placeholder is used when
          blank.
        </small>
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
          {product ? "Save product" : "Create product"}
        </button>
        <Link href="/admin/catalogue/products">Cancel</Link>
      </div>
    </form>
  );
}
