import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import {
  X,
  Globe,
  Plus,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Star,
  ShieldCheck,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react';

interface CustomDomainsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  publishedUrl?: string;
}

interface DnsRecordItem {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT';
  host: string;
  value: string;
  ttl?: number;
  purpose: string;
}

interface CustomDomainItem {
  id: string;
  projectId: string;
  domain: string;
  normalizedDomain: string;
  isApex: boolean;
  isPrimary: boolean;
  verificationStatus:
    | 'not_configured'
    | 'pending_dns'
    | 'awaiting_verification'
    | 'verifying'
    | 'ssl_provisioning'
    | 'active'
    | 'failed';
  sslStatus: 'active' | 'provisioning' | 'pending' | 'failed';
  verificationToken: string;
  dnsRecords: DnsRecordItem[];
  lastCheckedAt?: string;
  verifiedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export const CustomDomainsModal: React.FC<CustomDomainsModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  publishedUrl,
}) => {
  const { token } = useAuth();

  const [domains, setDomains] = useState<CustomDomainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeDnsDomainId, setActiveDnsDomainId] = useState<string | null>(null);

  const getHeaders = (hasBody = false) => {
    const headers: Record<string, string> = {};
    if (hasBody) headers['Content-Type'] = 'application/json';
    const currentToken = token || localStorage.getItem('remix_auth_token');
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;
    return headers;
  };

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/domains`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const list: CustomDomainItem[] = data.domains || [];
        setDomains(list);
        if (list.length > 0 && !activeDnsDomainId) {
          setActiveDnsDomainId(list[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load domains:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDomains();
      setErrorMessage(null);
      setSuccessMessage(null);
      setNewDomain('');
    }
  }, [isOpen, projectId]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = newDomain.trim();
    if (!raw) return;

    setAddingDomain(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/domains`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ domain: raw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add custom domain.');

      setNewDomain('');
      setSuccessMessage(`Domain "${data.domain.domain}" added. Configure the DNS records below to verify.`);
      await fetchDomains();
      setActiveDnsDomainId(data.domain.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error adding domain.');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleVerify = async (domainId: string) => {
    setVerifyingDomainId(domainId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/domains/${domainId}/verify`, {
        method: 'POST',
        headers: getHeaders(true),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification check failed.');

      if (data.domain.verificationStatus === 'active') {
        setSuccessMessage(`Domain "${data.domain.domain}" is verified and active!`);
      } else {
        setErrorMessage(data.message || 'DNS records have not propagated yet. Please wait a few minutes.');
      }
      await fetchDomains();
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed.');
    } finally {
      setVerifyingDomainId(null);
    }
  };

  const handleSetPrimary = async (domainId: string) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/domains/${domainId}/primary`, {
        method: 'POST',
        headers: getHeaders(true),
      });
      if (res.ok) {
        await fetchDomains();
        setSuccessMessage('Primary domain updated.');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleRemoveDomain = async (domainId: string, domainName: string) => {
    if (!window.confirm(`Disconnect "${domainName}" from this project? The domain will stop pointing to this site.`)) {
      return;
    }

    setErrorMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/domains/${domainId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        await fetchDomains();
        setSuccessMessage(`Domain "${domainName}" removed.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center">
              <Globe className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-950 font-sans">Custom Domains</h3>
              <p className="text-[11px] font-mono text-zinc-400">
                {publishedUrl ? publishedUrl : `${projectName} · Domains Management`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Banners */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-start gap-2.5 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">DNS Propagation Notice</span>
              <span className="text-[11px] leading-relaxed">{errorMessage}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Add Domain Form */}
          <form onSubmit={handleAddDomain} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-3">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-700 font-semibold">
              Connect a Domain You Own
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com or app.example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-900 bg-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={addingDomain || !newDomain.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addingDomain ? 'Adding...' : 'Add Domain'}</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">
              Enter your apex domain (e.g., <code>mybrand.com</code>) or subdomain (e.g., <code>www.mybrand.com</code>).
            </p>
          </form>

          {/* Domains List */}
          {loading ? (
            <div className="py-8 text-center text-xs font-mono text-zinc-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-900" />
              <span>Loading domain records...</span>
            </div>
          ) : domains.length === 0 ? (
            <div className="p-8 border border-dashed border-zinc-300 rounded-xl text-center space-y-2 bg-zinc-50/50">
              <Globe className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-xs font-bold text-zinc-900 font-sans">No Custom Domains Connected</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Add your domain above to route your visitors to this published website with automated SSL.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                  Connected Domains ({domains.length})
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">Automatic SSL/TLS provided</span>
              </div>

              {domains.map((dom) => {
                const isSelected = activeDnsDomainId === dom.id;
                const isLive = dom.verificationStatus === 'active';
                const isVerifying = verifyingDomainId === dom.id;

                return (
                  <div
                    key={dom.id}
                    className={`rounded-xl border transition-all ${
                      isSelected ? 'border-zinc-900 shadow-2xs' : 'border-zinc-200 bg-white'
                    }`}
                  >
                    {/* Domain Header Row */}
                    <div
                      onClick={() => setActiveDnsDomainId(isSelected ? null : dom.id)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-white rounded-t-xl"
                    >
                      <div className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-zinc-700 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-zinc-950 font-mono">{dom.domain}</span>
                            {dom.isPrimary && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                                Primary
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                                isLive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : dom.verificationStatus === 'awaiting_verification'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                              <span>
                                {isLive
                                  ? 'Active & Secure'
                                  : dom.verificationStatus === 'awaiting_verification'
                                  ? 'Awaiting Verification'
                                  : 'DNS Setup Required'}
                              </span>
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                            {dom.isApex ? 'Apex domain' : 'Subdomain'} · Added{' '}
                            {new Date(dom.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Domain Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {publishedUrl && (
                          <a
                            href={`/domains/${dom.id}/preview`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors flex items-center gap-1"
                            title="Preview live site routed under this domain"
                          >
                            <span>Preview</span>
                            <ExternalLink className="w-3 h-3 text-zinc-400" />
                          </a>
                        )}

                        {isLive ? (
                          <a
                            href={`https://${dom.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-zinc-100 text-zinc-800 hover:bg-zinc-200 transition-colors flex items-center gap-1"
                          >
                            <span>Visit</span>
                            <ExternalLink className="w-3 h-3 text-zinc-500" />
                          </a>
                        ) : (
                          <button
                            onClick={() => handleVerify(dom.id)}
                            disabled={isVerifying}
                            className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
                            <span>{isVerifying ? 'Checking DNS...' : 'Verify DNS'}</span>
                          </button>
                        )}

                        {!dom.isPrimary && (
                          <button
                            onClick={() => handleSetPrimary(dom.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 text-[11px]"
                            title="Set as primary domain"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleRemoveDomain(dom.id, dom.domain)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 text-[11px]"
                          title="Remove domain"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable DNS Records Table */}
                    {isSelected && (
                      <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 space-y-4 rounded-b-xl animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-700 font-semibold">
                            Required DNS Configuration
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            Log into your domain registrar (Namecheap, GoDaddy, Cloudflare) and add these records:
                          </span>
                        </div>

                        {/* DNS Table */}
                        <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-mono text-[10px] uppercase">
                              <tr>
                                <th className="p-2.5 font-semibold">Type</th>
                                <th className="p-2.5 font-semibold">Host / Name</th>
                                <th className="p-2.5 font-semibold">Value / Destination</th>
                                <th className="p-2.5 font-semibold">TTL</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
                              {dom.dnsRecords.map((rec, rIdx) => {
                                const hostKey = `${dom.id}_host_${rIdx}`;
                                const valKey = `${dom.id}_val_${rIdx}`;

                                return (
                                  <tr key={rIdx} className="hover:bg-zinc-50/50">
                                    <td className="p-2.5 font-bold text-zinc-950">
                                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800">
                                        {rec.type}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-zinc-700">
                                      <div className="flex items-center gap-1.5">
                                        <span className="truncate max-w-[120px]">{rec.host}</span>
                                        <button
                                          onClick={() => handleCopy(hostKey, rec.host)}
                                          className="p-1 text-zinc-400 hover:text-zinc-900"
                                          title="Copy host"
                                        >
                                          {copiedKey === hostKey ? (
                                            <Check className="w-3 h-3 text-emerald-600" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                    <td className="p-2.5 text-zinc-900 font-semibold">
                                      <div className="flex items-center gap-1.5">
                                        <span className="truncate max-w-[180px] sm:max-w-[240px]">{rec.value}</span>
                                        <button
                                          onClick={() => handleCopy(valKey, rec.value)}
                                          className="p-1 text-zinc-400 hover:text-zinc-900"
                                          title="Copy value"
                                        >
                                          {copiedKey === valKey ? (
                                            <Check className="w-3 h-3 text-emerald-600" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                    <td className="p-2.5 text-zinc-400">{rec.ttl || 60}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Tips Callout */}
                        <div className="p-3 bg-zinc-100/70 rounded-xl text-[11px] text-zinc-600 space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                            <Info className="w-3.5 h-3.5" />
                            <span>Registrar instructions</span>
                          </div>
                          <p>
                            • Do NOT delete any existing email records (MX, SPF, DKIM). Only add the A/CNAME and TXT verification records listed above.
                          </p>
                          <p>
                            • DNS propagation usually takes 1 to 5 minutes, but can take up to 24 hours depending on your registrar.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
