import "server-only";

type EnquiryEmail = {
  id: string;
  tenantName: string;
  recipient: string;
  kind: string;
  name: string;
  email: string;
  phone?: string;
  interest: string;
  budget?: string;
  message: string;
  cartItems: Array<{
    name: string;
    sku: string;
    priceMinor: number | null;
  }>;
  estimatedTotalMinor?: number;
};

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );

export async function sendEnquiryEmail(input: EnquiryEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { status: "not_configured" as const, providerId: null };

  const cart = input.cartItems.length
    ? `<h2>Requested products</h2><ul>${input.cartItems
        .map(
          (item) =>
            `<li>${escapeHtml(item.name)} (${escapeHtml(item.sku)}) — ${
              item.priceMinor === null
                ? "Price on request"
                : `€${(item.priceMinor / 100).toFixed(2)}`
            }</li>`,
        )
        .join("")}</ul>`
    : "";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:
        process.env.ENQUIRY_EMAIL_FROM ??
        "Nextech Store <onboarding@resend.dev>",
      to: [input.recipient],
      reply_to: input.email,
      subject: `[Nextech] ${input.interest} — ${input.name}`,
      html: `<h1>New Nextech enquiry</h1>
        <p><strong>Reference:</strong> ${escapeHtml(input.id)}</p>
        <p><strong>Type:</strong> ${escapeHtml(input.kind)}</p>
        <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(input.phone || "Not supplied")}</p>
        <p><strong>Interest:</strong> ${escapeHtml(input.interest)}</p>
        <p><strong>Budget:</strong> ${escapeHtml(input.budget || "Not supplied")}</p>
        <h2>Message</h2><p>${escapeHtml(input.message).replaceAll("\n", "<br>")}</p>
        ${cart}
        ${input.estimatedTotalMinor == null ? "" : `<p><strong>Estimated total:</strong> €${(input.estimatedTotalMinor / 100).toFixed(2)}</p>`}
        <p>View and manage this request in the ${escapeHtml(input.tenantName)} admin portal.</p>`,
    }),
  });
  if (!response.ok) return { status: "failed" as const, providerId: null };
  const data = (await response.json()) as { id?: string };
  return { status: "sent" as const, providerId: data.id ?? null };
}
