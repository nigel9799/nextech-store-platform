"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const svgDataUrlPrefix = "data:image/svg+xml;utf-8,";

function encodeQrCodeDataUrl(value: string) {
  if (!value.startsWith(svgDataUrlPrefix)) return value.trim();
  return `${svgDataUrlPrefix}${encodeURIComponent(value.slice(svgDataUrlPrefix.length))}`;
}

export function MfaEnrollment() {
  const router = useRouter();
  const started = useRef(false);
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      const supabase = createClient();
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.data?.totp.length) {
        router.replace("/admin/mfa/challenge");
        return;
      }
      for (const factor of factors.data?.all ?? []) {
        if (factor.factor_type === "totp" && factor.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }
      const enrollment = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Nextech admin",
      });
      if (enrollment.error)
        return setError("Authenticator setup could not be started.");
      setFactorId(enrollment.data.id);
      setQrCode(enrollment.data.totp.qr_code);
      setSecret(enrollment.data.totp.secret);
    })();
  }, [router]);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const supabase = createClient();
    const result = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    if (result.error)
      return setError(
        "That code was not accepted. Wait for a new code and try again.",
      );
    router.replace("/admin");
    router.refresh();
  }

  if (error && !factorId)
    return (
      <p className="form-notice form-notice-error" role="alert">
        {error}
      </p>
    );
  if (!factorId)
    return <p role="status">Preparing secure authenticator setup…</p>;

  return (
    <form className="admin-form" onSubmit={verify}>
      <p>
        Scan this QR code with an authenticator app, then enter its current
        six-digit code.
      </p>
      <Image
        className="mfa-qr"
        src={encodeQrCodeDataUrl(qrCode)}
        alt="TOTP setup QR code"
        width={220}
        height={220}
        unoptimized
      />
      <details>
        <summary>Cannot scan the code?</summary>
        <code className="mfa-secret">{secret}</code>
      </details>
      <label htmlFor="totp-enrollment-code">Authenticator code</label>
      <input
        id="totp-enrollment-code"
        name="code"
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
      <button className="admin-button" type="submit">
        Verify and continue
      </button>
    </form>
  );
}
