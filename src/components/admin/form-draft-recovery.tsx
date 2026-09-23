"use client";

import { useEffect } from "react";

type DraftValue = string | boolean;

function setControlValue(
  control: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  const prototype =
    control instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  setter?.call(control, value);
  control.dispatchEvent(new Event("input", { bubbles: true }));
}

export function FormDraftRecovery({
  formId,
  restore,
  storageKey,
}: {
  formId: string;
  restore: boolean;
  storageKey: string;
}) {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    if (restore) {
      try {
        const saved = JSON.parse(
          window.localStorage.getItem(storageKey) ?? "{}",
        ) as Record<string, DraftValue>;
        for (const [name, value] of Object.entries(saved)) {
          const control = form.elements.namedItem(name);
          if (
            control instanceof HTMLInputElement &&
            control.type === "checkbox" &&
            typeof value === "boolean"
          ) {
            control.checked = value;
            control.dispatchEvent(new Event("change", { bubbles: true }));
          } else if (
            (control instanceof HTMLInputElement ||
              control instanceof HTMLTextAreaElement) &&
            typeof value === "string"
          ) {
            setControlValue(control, value);
          } else if (
            control instanceof HTMLSelectElement &&
            typeof value === "string"
          ) {
            control.value = value;
            control.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    } else {
      window.localStorage.removeItem(storageKey);
    }

    const save = () => {
      const values: Record<string, DraftValue> = {};
      for (const element of Array.from(form.elements)) {
        if (
          !(element instanceof HTMLInputElement) &&
          !(element instanceof HTMLTextAreaElement) &&
          !(element instanceof HTMLSelectElement)
        )
          continue;
        if (
          !element.name ||
          (element instanceof HTMLInputElement &&
            ["file", "hidden", "submit"].includes(element.type))
        )
          continue;
        values[element.name] =
          element instanceof HTMLInputElement && element.type === "checkbox"
            ? element.checked
            : element.value;
      }
      window.localStorage.setItem(storageKey, JSON.stringify(values));
    };

    form.addEventListener("input", save);
    form.addEventListener("change", save);
    form.addEventListener("submit", save);
    return () => {
      form.removeEventListener("input", save);
      form.removeEventListener("change", save);
      form.removeEventListener("submit", save);
    };
  }, [formId, restore, storageKey]);

  return null;
}
