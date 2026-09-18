import {
  addEnquiryCommentAction,
  updateEnquiryStatusAction,
} from "@/app/admin/enquiries/actions";
import { requireAdminContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string; status?: string }>;
}) {
  const context = await requireAdminContext("manage_enquiries");
  const query = await searchParams;
  const supabase = await createClient();
  const statuses = ["new", "contacted", "quoted", "closed"] as const;
  const selectedStatus = statuses.includes(
    query.status as (typeof statuses)[number],
  )
    ? (query.status as (typeof statuses)[number])
    : "all";
  let enquiryQuery = supabase
    .from("enquiries")
    .select(
      "id, kind, customer_name, customer_email, customer_phone, interest, budget, message, cart_items, estimated_total_minor, status, email_delivery_status, created_at",
    )
    .eq("tenant_id", context.tenant.id);
  if (selectedStatus !== "all") {
    enquiryQuery = enquiryQuery.eq("status", selectedStatus);
  }
  const { data: enquiries } = await enquiryQuery.order("created_at", {
    ascending: false,
  });
  const enquiryIds = (enquiries ?? []).map((enquiry) => enquiry.id);
  const { data: comments } = enquiryIds.length
    ? await supabase
        .from("enquiry_comments")
        .select("id, enquiry_id, author_name, body, created_at")
        .eq("tenant_id", context.tenant.id)
        .in("enquiry_id", enquiryIds)
        .order("created_at", { ascending: true })
    : { data: [] };

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
          {query.notice === "comment-added"
            ? "Internal note added."
            : "Enquiry updated."}
        </p>
      ) : null}
      {query.error ? (
        <p className="form-notice form-notice-error" role="alert">
          {query.error === "invalid-comment"
            ? "Enter a note before saving."
            : "The enquiry could not be updated."}
        </p>
      ) : null}
      <form className="admin-filter-form" method="get">
        <label htmlFor="enquiry-status-filter">Filter by status</label>
        <select
          id="enquiry-status-filter"
          name="status"
          defaultValue={selectedStatus}
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="quoted">Quoted</option>
          <option value="closed">Closed</option>
        </select>
        <button className="admin-button" type="submit">
          Apply filter
        </button>
      </form>
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
            const enquiryComments = (comments ?? []).filter(
              (comment) => comment.enquiry_id === enquiry.id,
            );
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
                <section
                  className="admin-enquiry-notes"
                  aria-label="Internal notes"
                >
                  <h3>Internal notes</h3>
                  {enquiryComments.length ? (
                    <ol>
                      {enquiryComments.map((comment) => (
                        <li key={comment.id}>
                          <p>{comment.body}</p>
                          <small>
                            {comment.author_name} ·{" "}
                            {new Date(comment.created_at).toLocaleString(
                              "en-MT",
                            )}
                          </small>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="admin-muted">No internal notes yet.</p>
                  )}
                  <form
                    action={addEnquiryCommentAction}
                    className="admin-note-form"
                  >
                    <input type="hidden" name="id" value={enquiry.id} />
                    <input type="hidden" name="status" value={selectedStatus} />
                    <label htmlFor={`comment-${enquiry.id}`}>
                      Add a private note
                    </label>
                    <textarea
                      id={`comment-${enquiry.id}`}
                      name="comment"
                      maxLength={2000}
                      required
                      rows={3}
                      placeholder="e.g. Called customer and prepared quotation…"
                    />
                    <button className="admin-button" type="submit">
                      Add note
                    </button>
                  </form>
                </section>
              </article>
            );
          })
        )}
      </section>
    </>
  );
}
