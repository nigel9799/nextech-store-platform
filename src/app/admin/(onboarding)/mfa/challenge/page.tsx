import { AuthCard } from "@/components/admin/auth-card";
import { MfaChallenge } from "@/components/admin/mfa-challenge";
import { requireAuthenticatedUser } from "@/lib/auth/context";

export default async function MfaChallengePage() {
  await requireAuthenticatedUser();
  return (
    <AuthCard eyebrow="Identity verification" title="Verify authenticator">
      <MfaChallenge />
    </AuthCard>
  );
}
