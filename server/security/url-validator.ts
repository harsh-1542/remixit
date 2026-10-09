export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  error?: string;
}

const PRIVATE_IP_REGEX =
  /(^127\.)|(^10\.)|(^172\.(1[6-9]|2[0-9]|3[0-1])\.)|(^192\.168\.)|(^169\.254\.)|(^0\.)|(^localhost$)/i;

export function validateAndNormalizeUrl(rawInput: string): UrlValidationResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return { isValid: false, error: "Please enter a valid website URL." };
  }

  let trimmed = rawInput.trim();
  if (!trimmed) {
    return { isValid: false, error: "Please enter a website URL." };
  }

  // Prepend https:// if protocol is omitted
  if (!/^https?:\/\//i.test(trimmed)) {
    // If it starts with illegal protocols
    if (/^[a-zA-Z0-9_-]+:/i.test(trimmed)) {
      return { isValid: false, error: "Only http and https websites are supported." };
    }
    trimmed = `https://${trimmed}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: "That doesn't look like a valid website URL." };
  }

  // Protocol check
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      isValid: false,
      error: "Only HTTP and HTTPS websites can be analyzed.",
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check for localhost or obvious private names
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1'
  ) {
    return {
      isValid: false,
      error: "Localhost and internal addresses cannot be analyzed.",
    };
  }

  // Check IPv4 literal patterns
  if (PRIVATE_IP_REGEX.test(hostname)) {
    return {
      isValid: false,
      error: "Private and internal network IP addresses are not permitted.",
    };
  }

  // Check for metadata endpoint attempts
  if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
    return {
      isValid: false,
      error: "Cloud metadata endpoints cannot be accessed.",
    };
  }

  // Normalize: remove default ports, trailing slashes on root, strip tracking params
  const cleanUrl = new URL(parsed.toString());
  const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
  trackingParams.forEach((param) => cleanUrl.searchParams.delete(param));

  // Normalize path
  if (cleanUrl.pathname === '/') {
    cleanUrl.pathname = '';
  }

  return {
    isValid: true,
    normalizedUrl: cleanUrl.origin + cleanUrl.pathname + (cleanUrl.search || ''),
  };
}
