/**
 * Only allow loopback / private-network hosts for the "local" provider
 * (the API server proxies requests — this keeps it SSRF-safe).
 * Returns null when the host is allowed, or an error message string.
 */
export function assertLocalHttpHost(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return `Invalid URL: ${rawUrl}`;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "URL must start with http:// or https://";
  }
  const h = url.hostname.toLowerCase();
  const loopback =
    h === "127.0.0.1" ||
    h === "::1" ||
    h === "[::1]" ||
    h === "localhost" ||
    h.endsWith(".localhost");
  const priv10 = /^10\./.test(h);
  const priv192 = /^192\.168\./.test(h);
  const priv172 = /^172\.(1[6-9]|2\d|3[01])\./.test(h);
  if (!loopback && !priv10 && !priv192 && !priv172) {
    return "Refusing to connect: the Local provider only allows loopback or private-network hosts.";
  }
  return null;
}
