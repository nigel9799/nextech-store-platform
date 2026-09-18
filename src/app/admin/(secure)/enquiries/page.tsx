import { updateEnquiryStatusAction } from "@/app/admin/enquiries/actions";
import { requireAdminContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const context = await requireAdminContext("manage_enquiries");
  const query = await searchParams;
  const supabase = await createClient();
  const { data: enquiries } = await supabase
    .from("enquiries")
    .select(
      "id, kind, customer_name, customer_email, customer_phone, interest, budget, message, cart_items, estimated_total_minor, status, email_delivery_status, created_at",
    )
    .eq("tenant_id", context.tenant.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="admin-heading">
        <p className="admin-eyebrow">Customer requests</p>
        <h1>ENQUIRIES</h1>
        <p>
          Questions, product requests and cart enquiries submitted through the
          storefront.
        </p>
      </div>
      {query.notice ? (
        <p className="form-notice" role="status">
          Enquiry updated.
        </p>
      ) : null}
      {query.error ? (
        <p className="form-notice form-notice-error" role="alert">
          The enquiry could not be updated.
        </p>
      ) : null}
      <section className="admin-list" aria-label="Customer enquiries">
        {!enquiries?.length ? (
          <div className="admin-empty">
            <strong>No enquiries yet.</strong>
            <p>New storefront requests will appear here.</p>
          </div>
        ) : (
          enquiries.map((enquiry) => {
            const items = Array.isArray(enquiry.cart_items)
              ? (enquiry.cart_items as Array<{ name?: string; sku?: string }>)
              : [];
            return (
              <article className="admin-panel" key={enquiry.id}>
                <div className="admin-heading-row">
                  <div>
                    <small>
                      {new Date(enquiry.created_at).toLocaleString("en-MT")}
                    </small>
                    <h2>{enquiry.interest}</h2>
                  </div>
                  <span>{enquiry.status}</span>
                </div>
                <p>
                  <strong>{enquiry.customer_name}</strong> ·{" "}
                  <a href={`mailto:${enquiry.customer_email}`}>
                    {enquiry.customer_email}
                  </a>
                  {enquiry.customer_phone ? (
                    <>
                      {" "}
                      ·{" "}
                      <a href={`tel:${enquiry.customer_phone}`}>
                        {enquiry.customer_phone}
                      </a>
                    </>
                  ) : null}
                </p>
                <p>{enquiry.message}</p>
                {enquiry.budget ? (
                  <p>
                    <strong>Budget:</strong> {enquiry.budget}
                  </p>
                ) : null}
                {items.length ? (
                  <p>
                    <strong>Products:</strong>{" "}
                    {items
                      .map(
                        (item) =>
                          `${item.name ?? "Product"} (${item.sku ?? "No SKU"})`,
                      )
                      .join(", ")}
                  </p>
                ) : null}
                <p>
                  <small>
                    Email notification: {enquiry.email_delivery_status}
                  </small>
                </p>
                <form
                  className="admin-inline-form"
                  action={updateEnquiryStatusAction}
                >
                  <input type="hidden" name="id" value={enquiry.id} />
                  <label>
                    Status{" "}
                    <select name="status" defaultValue={enquiry.status}>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="quoted">Quoted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </label>
                  <button className="admin-button" type="submit">
                    Update
                  </button>
                </form>
              </article>
            );
          })
        )}
      </section>
    </>
  );
}
