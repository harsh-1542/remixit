import dns from 'dns/promises';
import crypto from 'crypto';
import { db } from '../db';
import { CustomDomainRecord, DnsInstructionRecord, DomainVerificationStatus } from '../db/types';

export class DomainService {
  /**
   * Validate and normalize domain name.
   */
  validateDomain(rawInput: string): {
    valid: boolean;
    normalized: string;
    isApex: boolean;
    error?: string;
  } {
    if (!rawInput || typeof rawInput !== 'string') {
      return { valid: false, normalized: '', isApex: false, error: 'Domain name is required.' };
    }

    let domain = rawInput.trim().toLowerCase();

    // Remove protocol and paths if accidentally pasted
    domain = domain.replace(/^https?:\/\//i, '');
    domain = domain.split('/')[0];
    domain = domain.split('?')[0];
    domain = domain.split(':')[0]; // port
    domain = domain.replace(/\.+$/, ''); // trailing dots

    // RFC 1123 hostname regex
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

    if (!domainRegex.test(domain)) {
      return {
        valid: false,
        normalized: domain,
        isApex: false,
        error: 'Invalid domain format. Enter a valid hostname such as "example.com" or "app.example.com" without http:// or slashes.',
      };
    }

    if (domain.length > 253) {
      return { valid: false, normalized: domain, isApex: false, error: 'Domain name is too long.' };
    }

    // Determine if apex domain (e.g. example.com vs sub.example.com)
    const parts = domain.split('.');
    const isApex = parts.length === 2;

    return {
      valid: true,
      normalized: domain,
      isApex,
    };
  }

  /**
   * Add a new custom domain to a published project.
   */
  async addDomain(userId: string, projectId: string, rawDomain: string): Promise<CustomDomainRecord> {
    // 1. Verify project ownership
    const project = await db.getProject(projectId, userId);
    if (!project) {
      throw new Error('Project not found or unauthorized.');
    }

    // 2. Validate domain syntax
    const validation = this.validateDomain(rawDomain);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid domain hostname.');
    }

    const normalizedDomain = validation.normalized;

    // 3. Availability check: Prevent duplicate domain assignment across any project
    const existing = await db.findDomainByName(normalizedDomain);
    if (existing) {
      if (existing.projectId === projectId) {
        throw new Error(`Domain "${normalizedDomain}" is already added to this project.`);
      } else {
        throw new Error(`Domain "${normalizedDomain}" is already assigned to another project in Remix.`);
      }
    }

    // 4. Generate verification token & DNS records
    const verificationToken = `remix_${crypto.randomBytes(8).toString('hex')}`;
    const domainId = `dom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const existingProjectDomains = await db.listProjectDomains(projectId, userId);
    const isFirst = existingProjectDomains.length === 0;

    let dnsRecords: DnsInstructionRecord[] = [];

    if (validation.isApex) {
      // Apex domain configuration
      dnsRecords = [
        {
          type: 'A',
          host: '@',
          value: '76.76.21.21',
          ttl: 60,
          purpose: 'Points apex root traffic to Remix Edge routing cluster',
        },
        {
          type: 'TXT',
          host: `_remix-challenge`,
          value: `remix-verify=${verificationToken}`,
          ttl: 60,
          purpose: 'Verifies domain ownership and authorization',
        },
      ];
    } else {
      // Subdomain configuration (e.g. www, app, blog)
      const subLabel = normalizedDomain.split('.')[0];
      dnsRecords = [
        {
          type: 'CNAME',
          host: subLabel,
          value: 'cname.remix.design',
          ttl: 60,
          purpose: 'Aliases subdomain to Remix Edge proxy network',
        },
        {
          type: 'TXT',
          host: `_remix-challenge.${subLabel}`,
          value: `remix-verify=${verificationToken}`,
          ttl: 60,
          purpose: 'Verifies domain ownership and authorization',
        },
      ];
    }

    const record: CustomDomainRecord = {
      id: domainId,
      projectId,
      userId,
      deploymentId: project.currentDeploymentId,
      provider: 'remix_managed',
      domain: normalizedDomain,
      normalizedDomain,
      isApex: validation.isApex,
      isPrimary: isFirst,
      verificationStatus: 'pending_dns',
      sslStatus: 'pending',
      verificationToken,
      dnsRecords,
      lastCheckedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    return db.saveDomain(record);
  }

  /**
   * Verify DNS records and SSL provisioning for a custom domain.
   */
  async verifyDomain(userId: string, domainId: string): Promise<CustomDomainRecord> {
    const domain = await db.getDomain(domainId, userId);
    if (!domain) {
      throw new Error('Custom domain not found or unauthorized.');
    }

    const now = new Date().toISOString();
    let hasRoutingRecord = false;
    let hasTxtRecord = false;
    let checkDetails = '';

    try {
      // 1. Check Routing Record (CNAME or A)
      if (domain.isApex) {
        try {
          const aRecords = await dns.resolve4(domain.normalizedDomain);
          if (aRecords && aRecords.includes('76.76.21.21')) {
            hasRoutingRecord = true;
          } else if (aRecords && aRecords.length > 0) {
            checkDetails = `Found A record ${aRecords.join(', ')} instead of 76.76.21.21.`;
          }
        } catch (err: any) {
          checkDetails = `A record not resolved yet (${err.code || err.message}).`;
        }
      } else {
        try {
          const cnames = await dns.resolveCname(domain.normalizedDomain);
          if (cnames && cnames.some((c) => c.toLowerCase().includes('remix.design') || c.toLowerCase().includes('vercel'))) {
            hasRoutingRecord = true;
          } else if (cnames && cnames.length > 0) {
            checkDetails = `Found CNAME ${cnames.join(', ')} instead of cname.remix.design.`;
          }
        } catch (err: any) {
          checkDetails = `CNAME not resolved yet (${err.code || err.message}).`;
        }
      }

      // 2. Check TXT Challenge Record
      const txtHost = domain.isApex
        ? `_remix-challenge.${domain.normalizedDomain}`
        : `_remix-challenge.${domain.normalizedDomain}`;

      try {
        const txtRecords = await dns.resolveTxt(txtHost);
        const flattened = txtRecords.flat();
        const expectedToken = `remix-verify=${domain.verificationToken}`;
        if (flattened.some((t) => t.includes(expectedToken))) {
          hasTxtRecord = true;
        }
      } catch (err: any) {
        // TXT record may still be propagating
      }

      // 3. Determine new status
      let newStatus: DomainVerificationStatus = 'pending_dns';
      let newSsl = domain.sslStatus;
      let errorMsg: string | undefined = undefined;

      if (hasRoutingRecord && hasTxtRecord) {
        newStatus = 'active';
        newSsl = 'active';
        errorMsg = undefined;
      } else if (hasRoutingRecord && !hasTxtRecord) {
        newStatus = 'awaiting_verification';
        errorMsg = 'Routing record detected, but TXT challenge record is not yet found. Please verify TXT configuration.';
      } else if (!hasRoutingRecord && hasTxtRecord) {
        newStatus = 'pending_dns';
        errorMsg = `TXT verification record confirmed, but ${domain.isApex ? 'A record' : 'CNAME record'} has not propagated yet.`;
      } else {
        newStatus = 'pending_dns';
        errorMsg = checkDetails || 'DNS records have not propagated yet. DNS changes can take a few minutes to complete.';
      }

      return db.updateDomain(domainId, {
        verificationStatus: newStatus,
        sslStatus: newSsl,
        lastCheckedAt: now,
        verifiedAt: newStatus === 'active' ? now : domain.verifiedAt,
        errorMessage: errorMsg,
      });
    } catch (err: any) {
      console.warn('[DomainService] Verification error:', err);
      return db.updateDomain(domainId, {
        lastCheckedAt: now,
        errorMessage: err.message || 'DNS verification request timed out.',
      });
    }
  }

  /**
   * Set primary domain for a project.
   */
  async setPrimaryDomain(userId: string, projectId: string, domainId: string): Promise<CustomDomainRecord[]> {
    const domain = await db.getDomain(domainId, userId);
    if (!domain || domain.projectId !== projectId) {
      throw new Error('Domain not found or unauthorized.');
    }
    return db.setPrimaryDomain(projectId, domainId, userId);
  }

  /**
   * Remove custom domain.
   */
  async removeDomain(userId: string, domainId: string): Promise<boolean> {
    const domain = await db.getDomain(domainId, userId);
    if (!domain) {
      throw new Error('Custom domain not found or unauthorized.');
    }
    return db.deleteDomain(domainId, userId);
  }

  /**
   * List all custom domains for a project.
   */
  async listProjectDomains(userId: string, projectId: string): Promise<CustomDomainRecord[]> {
    const project = await db.getProject(projectId, userId);
    if (!project) throw new Error('Project not found or unauthorized.');
    return db.listProjectDomains(projectId, userId);
  }
}

export const domainService = new DomainService();
