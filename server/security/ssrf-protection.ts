import dns from 'dns/promises';

export interface SsrfCheckResult {
  safe: boolean;
  ip?: string;
  error?: string;
}

function isPrivateIp(ip: string): boolean {
  // IPv4 checks
  if (ip === '127.0.0.1' || ip === '0.0.0.0') return true;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('169.254.')) return true; // Link-local & cloud metadata
  
  const parts = ip.split('.').map(Number);
  if (parts.length === 4) {
    // 172.16.0.0 - 172.31.255.255
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 100.64.0.0/10 Carrier-grade NAT
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
  }

  // IPv6 checks
  if (ip === '::1' || ip === '::') return true;
  if (ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd')) return true; // Unique local address
  if (ip.toLowerCase().startsWith('fe80')) return true; // Link-local address

  return false;
}

export async function verifyHostSafety(hostname: string): Promise<SsrfCheckResult> {
  try {
    const lookup = await dns.lookup(hostname, { all: true });
    
    if (!lookup || lookup.length === 0) {
      return { safe: false, error: 'Could not resolve domain name via DNS.' };
    }

    for (const record of lookup) {
      if (isPrivateIp(record.address)) {
        return {
          safe: false,
          ip: record.address,
          error: 'Domain resolves to a restricted or private network address.',
        };
      }
    }

    return { safe: true, ip: lookup[0].address };
  } catch (err: any) {
    return {
      safe: false,
      error: `DNS resolution failed: ${err.message || 'Host unreachable'}`,
    };
  }
}
