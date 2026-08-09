const hostnamePattern =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function normalizeHostname(value: string) {
  const trimmed = value.trim().toLowerCase().replace(/\.$/, "");
  const withoutPort = (
    trimmed.startsWith("[")
      ? trimmed.slice(1, trimmed.indexOf("]"))
      : trimmed === "::1"
        ? trimmed
        : trimmed.split(":", 1)[0]
  ).replace(/\.$/, "");

  if (
    withoutPort === "localhost" ||
    withoutPort === "127.0.0.1" ||
    withoutPort === "::1"
  ) {
    return withoutPort;
  }

  if (!hostnamePattern.test(withoutPort)) {
    throw new Error("Invalid request hostname");
  }

  return withoutPort;
}

export function isLocalHostname(hostname: string) {
  return ["localhost", "127.0.0.1", "::1"].includes(hostname);
}
