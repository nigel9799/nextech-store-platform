import { updateSettingsAction } from "@/app/admin/catalogue/actions";
import { requireAdminContext } from "@/lib/auth/context";
import { defaultStorefrontConfig } from "@/lib/storefront/defaults";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const context = await requireAdminContext("manage_website");
  const query = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("settings")
    .eq("tenant_id", context.tenant.id)
    .maybeSingle();
  const settings =
    data?.settings && typeof data.settings === "object"
      ? (data.settings as Record<string, unknown>)
      : {};
  const contact =
    settings.contact && typeof settings.contact === "object"
      ? (settings.contact as Record<string, unknown>)
      : {};
  const value = (candidate: unknown, fallback: string) =>
    typeof candidate === "string" ? candidate : fallback;

  return (
    <>
      <div className="admin-heading">
        <p className="admin-eyebrow">Website</p>
        <h1>STORE SETTINGS</h1>
        <p>Update the most important Nextech branding and contact details.</p>
      </div>
      {query.notice === "updated" ? (
        <p className="form-notice" role="status">
          Store settings updated.
        </p>
      ) : null}
      {query.error ? (
        <p className="form-notice form-notice-error" role="alert">
          Check the entered settings and try again.
        </p>
      ) : null}
      <section className="admin-panel">
        <form className="admin-form admin-editor" action={updateSettingsAction}>
          <div className="admin-form-grid">
            <label>
              Store name <span>Required</span>
              <input
                name="brandName"
                required
                maxLength={80}
                defaultValue={value(
                  settings.brandName,
                  defaultStorefrontConfig.brandName,
                )}
              />
            </label>
            <label>
              Brand colour <span>Required</span>
              <input
                name="primaryColor"
                type="color"
                required
                defaultValue={value(
                  settings.primaryColor,
                  defaultStorefrontConfig.primaryColor,
                )}
              />
            </label>
          </div>
          <label className="admin-check">
            <input
              name="announcementEnabled"
              type="checkbox"
              defaultChecked={settings.announcementEnabled !== false}
            />
            Show the announcement bar
          </label>
          <label>
            Announcement text <span>Optional</span>
            <input
              name="announcementText"
              maxLength={160}
              defaultValue={value(
                settings.announcementText,
                defaultStorefrontConfig.announcementText,
              )}
            />
          </label>
          <div className="admin-form-grid">
            <label>
              Customer email <span>Required</span>
              <input
                name="email"
                type="email"
                required
                defaultValue={value(
                  contact.email,
                  defaultStorefrontConfig.contact.email,
                )}
              />
            </label>
            <label>
              WhatsApp / primary phone <span>Required</span>
              <input
                name="phoneOne"
                required
                defaultValue={value(
                  contact.phoneOne,
                  defaultStorefrontConfig.contact.phoneOne,
                )}
              />
            </label>
          </div>
          <div className="admin-form-grid">
            <label>
              Secondary phone <span>Optional</span>
              <input
                name="phoneTwo"
                defaultValue={value(
                  contact.phoneTwo,
                  defaultStorefrontConfig.contact.phoneTwo,
                )}
              />
            </label>
            <label>
              Location text <span>Required</span>
              <input
                name="location"
                required
                maxLength={120}
                defaultValue={value(
                  contact.location,
                  defaultStorefrontConfig.contact.location,
                )}
              />
            </label>
          </div>
          <button className="admin-button" type="submit">
            Save store settings
          </button>
        </form>
      </section>
    </>
  );
}
