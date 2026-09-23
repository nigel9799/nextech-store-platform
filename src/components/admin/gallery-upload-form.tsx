"use client";

import { useState } from "react";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
};

export function GalleryUploadForm({ action }: Props) {
  const [names, setNames] = useState<string[]>([]);

  return (
    <form className="admin-form admin-editor" action={action}>
      <label>
        Gallery images <span>Required</span>
        <input
          name="images"
          type="file"
          multiple
          required
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(event) =>
            setNames(
              Array.from(event.currentTarget.files ?? []).map(
                (file) => file.name,
              ),
            )
          }
        />
        <small>
          {names.length
            ? `${names.length} selected: ${names.join(", ")}`
            : "Choose multiple images together. Maximum 8 MB each."}
        </small>
      </label>
      <div className="admin-form-grid">
        <label>
          Shared title <span>Optional</span>
          <input name="title" maxLength={160} placeholder="e.g. RGB details" />
          <small>Applied to every image in this upload.</small>
        </label>
        <label>
          Alt text <span>Optional</span>
          <input
            name="altText"
            maxLength={200}
            placeholder="e.g. Custom Nextech gaming PC"
          />
          <small>Used for accessibility; filenames are used when blank.</small>
        </label>
      </div>
      <div className="admin-form-actions">
        <button className="admin-button" type="submit">
          Upload to Gallery
        </button>
      </div>
    </form>
  );
}
