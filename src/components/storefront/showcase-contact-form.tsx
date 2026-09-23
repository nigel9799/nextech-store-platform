"use client";

import { useState, type FormEvent } from "react";
import { MessengerIcon } from "./messenger-icon";

export function ShowcaseContactForm() {
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    setNotice("Sending your message…");
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "general",
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          interest: data.get("interest"),
          budget: data.get("budget"),
          message: data.get("message"),
          website: data.get("website"),
          cartItems: [],
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        reference?: string;
      };
      if (!response.ok) throw new Error(result.error);
      form.reset();
      setNotice(`Message sent. Reference: ${result.reference ?? "received"}.`);
    } catch {
      setNotice(
        "The email could not be sent. Please message Nextech on Facebook.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="showcase-form" onSubmit={submit}>
      <div className="showcase-form-grid">
        <label>
          <span className="showcase-field-label">Name</span>
          <input name="name" required minLength={2} maxLength={120} />
        </label>
        <label>
          <span className="showcase-field-label">Email</span>
          <input name="email" type="email" required maxLength={254} />
        </label>
        <label>
          <span className="showcase-field-label">
            Phone <em>Optional</em>
          </span>
          <input name="phone" type="tel" maxLength={40} />
        </label>
        <label>
          <span className="showcase-field-label">I’m interested in</span>
          <select name="interest" required defaultValue="Custom PC build">
            <option>Custom PC build</option>
            <option>Completed build enquiry</option>
            <option>Upgrade or repair</option>
            <option>General question</option>
          </select>
        </label>
      </div>
      <label>
        <span className="showcase-field-label">
          Approximate budget <em>Optional</em>
        </span>
        <input name="budget" maxLength={80} placeholder="e.g. €1,500" />
      </label>
      <label>
        <span className="showcase-field-label">How can we help?</span>
        <textarea
          name="message"
          required
          minLength={5}
          maxLength={4000}
          rows={6}
        />
      </label>
      <input
        className="showcase-honeypot"
        name="website"
        tabIndex={-1}
        autoComplete="off"
      />
      <div className="showcase-form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send enquiry"}
        </button>
        <a href="https://m.me/nextechmt" target="_blank" rel="noreferrer">
          <MessengerIcon />
          Message on Facebook
        </a>
      </div>
      {notice ? (
        <p className="showcase-form-notice" role="status">
          {notice}
        </p>
      ) : null}
    </form>
  );
}
