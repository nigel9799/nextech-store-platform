"use client";

import { useState } from "react";

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function NameSlugFields({
  initialName = "",
  initialSlug = "",
  itemLabel,
}: {
  initialName?: string;
  initialSlug?: string;
  itemLabel: "Product" | "Category";
}) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [customSlug, setCustomSlug] = useState(Boolean(initialSlug));

  return (
    <>
      <label>
        {itemLabel} name <span>Required</span>
        <input
          name="name"
          value={name}
          required
          maxLength={itemLabel === "Product" ? 160 : 80}
          placeholder={
            itemLabel === "Product"
              ? "e.g. NVIDIA GeForce RTX 5070 Ti 16GB"
              : "e.g. Graphic Cards"
          }
          onChange={(event) => {
            const value = event.target.value;
            setName(value);
            if (!customSlug) setSlug(slugify(value));
          }}
        />
        <small>This is the customer-facing name.</small>
      </label>
      <label>
        Page slug <span>Automatic</span>
        <input
          name="slug"
          value={slug}
          maxLength={itemLabel === "Product" ? 160 : 80}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          placeholder="Generated automatically from the name"
          onChange={(event) => {
            setCustomSlug(true);
            setSlug(event.target.value.toLowerCase());
          }}
        />
        <small>
          Used in the page address. Leave it alone to use the automatically
          generated value.
        </small>
        {customSlug ? (
          <button
            className="admin-text-button"
            type="button"
            onClick={() => {
              setCustomSlug(false);
              setSlug(slugify(name));
            }}
          >
            Regenerate from name
          </button>
        ) : null}
      </label>
    </>
  );
}
