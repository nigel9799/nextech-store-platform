import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveTenant, TenantResolutionError } from "@/lib/tenancy/resolve";

const acceptedTypes = new Set<EmailOtpType>(["invite", "recovery", "email"]);

export async function GET(request: NextRequest) {
  try {
    await resolveTenant(
      request.headers.get("x-forwarded-host") ??
        request.headers.get("host") ??
        "",
    );
  } catch (error) {
    if (error instanceof TenantResolutionError) {
      return new NextResponse("Not found", { status: 404 });
    }
    throw error;
  }
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = request.nextUrl.searchParams.get("next");
  const next = requestedNext?.startsWith("/admin/") ? requestedNext : "/admin";

  if (tokenHash && type && acceptedTypes.has(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(
    new URL("/admin/login?error=invalid-link", request.url),
  );
}
