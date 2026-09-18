import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sendEnquiryEmail } from "@/lib/email/enquiries";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { resolveTenant, TenantResolutionError } from "@/lib/tenancy/resolve";

const cartItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  sku: z.string().trim().min(1).max(80),
  priceMinor: z.number().int().nonnegative(),
});
const enquirySchema = z.object({
  kind: z.enum(["general", "product", "cart", "custom_build", "order_support"]),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().default(""),
  interest: z.string().trim().min(2).max(120),
  budget: z.string().trim().max(80).optional().default(""),
  message: z.string().trim().min(5).max(4000),
  cartItems: z.array(cartItemSchema).max(50).optional().default([]),
  website: z.string().max(0).optional().default(""),
});

export async function POST(request: NextRequest) {
  try {
    const tenant = await resolveTenant(
      request.headers.get("x-forwarded-host") ??
        request.headers.get("host") ??
        "",
    );
    const parsed = enquirySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Check the form fields and try again." },
        { status: 400 },
      );
    }
    const input = parsed.data;
    const total = input.cartItems.reduce(
      (sum, item) => sum + item.priceMinor,
      0,
    );
    const service = createServiceRoleClient();
    const { data: settingsRow } = await service
      .from("site_settings")
      .select("settings")
      .eq("tenant_id", tenant.id)
      .maybeSingle();
    const settings = settingsRow?.settings as
      Record<string, unknown> | undefined;
    const contact = settings?.contact as Record<string, unknown> | undefined;
    const recipient =
      (typeof contact?.notificationEmail === "string" &&
        contact.notificationEmail) ||
      process.env.ENQUIRY_NOTIFICATION_EMAIL ||
      "nigel9799@hotmail.com";
    const { data: enquiry, error } = await service
      .from("enquiries")
      .insert({
        tenant_id: tenant.id,
        kind: input.kind,
        customer_name: input.name,
        customer_email: input.email,
        customer_phone: input.phone || null,
        interest: input.interest,
        budget: input.budget || null,
        message: input.message,
        cart_items: input.cartItems,
        estimated_total_minor: input.cartItems.length ? total : null,
      })
      .select("id")
      .single();
    if (error || !enquiry) throw new Error("Enquiry persistence failed");

    const delivery = await sendEnquiryEmail({
      id: enquiry.id,
      tenantName: tenant.businessName,
      recipient,
      kind: input.kind,
      name: input.name,
      email: input.email,
      phone: input.phone,
      interest: input.interest,
      budget: input.budget,
      message: input.message,
      cartItems: input.cartItems,
      estimatedTotalMinor: input.cartItems.length ? total : undefined,
    });
    await service
      .from("enquiries")
      .update({
        email_delivery_status: delivery.status,
        email_provider_id: delivery.providerId,
      })
      .eq("id", enquiry.id)
      .eq("tenant_id", tenant.id);

    return NextResponse.json({ ok: true, reference: enquiry.id.slice(0, 8) });
  } catch (error) {
    const status = error instanceof TenantResolutionError ? 404 : 500;
    return NextResponse.json(
      { error: "Your request could not be sent. Please try WhatsApp." },
      { status },
    );
  }
}
