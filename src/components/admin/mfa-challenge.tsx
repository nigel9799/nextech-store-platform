"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function MfaChallenge() {
  const router = useRouter();
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const factors = await createClient().auth.mfa.listFactors();
      const factor = factors.data?.totp[0];
      if (!factor) return router.replace("/admin/mfa/enroll");
      setFactorId(factor.id);
    })();
  }, [router]);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const result = await createClient().auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    if (result.error)
      return setError(
        "That code was not accepted. Try the newest code in your app.",
      );
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className="admin-form" onSubmit={verify}>
      <p>Enter the current code from your authenticator app.</p>
      <label htmlFor="totp-challenge-code">Authenticator code</label>
      <input
        id="totp-challenge-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        required
      />
      {error ? (
        <p className="form-notice form-notice-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="admin-button" type="submit" disabled={!factorId}>
        Verify identity
      </button>
    </form>
  );
}
