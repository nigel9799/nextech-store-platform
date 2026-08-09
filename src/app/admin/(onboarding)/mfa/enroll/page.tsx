import { AuthCard } from "@/components/admin/auth-card";
import { MfaEnrollment } from "@/components/admin/mfa-enrollment";
import { requireAuthenticatedUser } from "@/lib/auth/context";

export default async function MfaEnrollPage() {
  await requireAuthenticatedUser();
  return (
    <AuthCard eyebrow="Mandatory security" title="Set up authenticator">
      <MfaEnrollment />
    </AuthCard>
  );
}
