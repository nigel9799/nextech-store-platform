"use client";

import { useMemo, useRef, useState } from "react";

type Props = {
  initialImages?: string[];
};

export function BuildImageManager({ initialImages = [] }: Props) {
  const [images, setImages] = useState(initialImages);
  const [coverName, setCoverName] = useState("");
  const [galleryNames, setGalleryNames] = useState<string[]>([]);
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const serializedImages = useMemo(() => images.join("\n"), [images]);

  function move(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= images.length) return;
    setImages((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  function makeCover(index: number) {
    setImages((current) => [
      current[index],
      ...current.filter((_, itemIndex) => itemIndex !== index),
    ]);
  }

  return (
    <fieldset className="admin-editor-section admin-image-manager">
      <legend>Build page images</legend>
      <p>
        Upload a cover and gallery photos directly from your computer. The first
        saved image is always used as the cover.
      </p>

      <input type="hidden" name="existingImageUrls" value={serializedImages} />

      {images.length ? (
        <div className="admin-image-list">
          {images.map((src, index) => (
            <article className="admin-image-item" key={`${src}-${index}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Saved build image ${index + 1}`} />
              <div>
                <strong>
                  {index === 0 ? "Cover image" : `Gallery ${index}`}
                </strong>
                <span>{src.split("/").pop()}</span>
              </div>
              <div className="admin-image-actions">
                {index !== 0 ? (
                  <button type="button" onClick={() => makeCover(index)}>
                    Make cover
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Move image ${index + 1} earlier`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === images.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Move image ${index + 1} later`}
                >
                  ↓
                </button>
                <button
                  className="danger"
                  type="button"
                  onClick={() =>
                    setImages((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-image-empty">No saved images yet.</div>
      )}

      <div className="admin-form-grid">
        <label>
          Upload a new cover <span>Optional</span>
          <input
            ref={coverInput}
            name="coverImage"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) =>
              setCoverName(event.currentTarget.files?.[0]?.name ?? "")
            }
          />
          <small>{coverName || "JPG, PNG, WebP or AVIF. Maximum 8 MB."}</small>
        </label>
        <label>
          Add gallery images <span>Optional</span>
          <input
            ref={galleryInput}
            name="galleryImages"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) =>
              setGalleryNames(
                Array.from(event.currentTarget.files ?? []).map(
                  (file) => file.name,
                ),
              )
            }
          />
          <small>
            {galleryNames.length
              ? `${galleryNames.length} selected: ${galleryNames.join(", ")}`
              : "Select several images together. Maximum 8 MB each."}
          </small>
        </label>
      </div>

      <details className="admin-image-url-import">
        <summary>Import images from web links</summary>
        <label>
          Direct HTTPS image URLs <span>Optional</span>
          <textarea
            name="externalImageUrls"
            maxLength={4000}
            rows={4}
            placeholder={
              "https://example.com/build-cover.jpg\nhttps://example.com/build-detail.jpg"
            }
          />
          <small>
            One link per line. New links are added after uploaded files.
          </small>
        </label>
      </details>
    </fieldset>
  );
}
