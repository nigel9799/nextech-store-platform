import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  resolveRequestTenant,
  TenantResolutionError,
} from "@/lib/tenancy/resolve";

export const dynamic = "force-dynamic";

export default async function AdminRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    await resolveRequestTenant();
  } catch (error) {
    if (error instanceof TenantResolutionError) notFound();
    throw error;
  }
  return children;
}
