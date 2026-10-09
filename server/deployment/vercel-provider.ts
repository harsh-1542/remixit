import {
  DeploymentProvider,
  DeploymentInput,
  DeploymentResult,
  DeploymentStatusResult,
} from './types';
import { managedProvider } from './managed-provider';

export class VercelDeploymentProvider implements DeploymentProvider {
  name = 'vercel' as const;
  displayName = 'Vercel';

  private token: string | undefined;
  private teamId: string | undefined;
  private projectId: string | undefined;

  constructor() {
    this.token = process.env.VERCEL_TOKEN;
    this.teamId = process.env.VERCEL_TEAM_ID;
    this.projectId = process.env.VERCEL_PROJECT_ID;
  }

  isConfigured(): boolean {
    return !!this.token && this.token.length > 10;
  }

  async deploy(input: DeploymentInput): Promise<DeploymentResult> {
    if (!this.isConfigured()) {
      // Graceful fallback to Remix Managed with clear notice
      console.log('[VercelProvider] VERCEL_TOKEN not set, deploying to Remix Managed provider.');
      const managedRes = await managedProvider.deploy(input);
      return {
        ...managedRes,
        buildLogSummary: 'Deployed via Remix Managed Publisher (VERCEL_TOKEN not configured).',
      };
    }

    try {
      // 1. Prepare files for Vercel API
      const vercelFiles = Object.entries(input.files).map(([file, data]) => ({
        file,
        data: Buffer.from(data).toString('base64'),
        encoding: 'base64',
      }));

      const projectName = input.websiteDefinition.name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50);

      const urlParams = this.teamId ? `?teamId=${encodeURIComponent(this.teamId)}` : '';
      const response = await fetch(`https://api.vercel.com/v13/deployments${urlParams}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          files: vercelFiles,
          projectSettings: {
            framework: null,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Vercel API deployment failed.');
      }

      const vercelUrl = data.url ? `https://${data.url}` : `https://${projectName}.vercel.app`;

      return {
        providerDeploymentId: data.id || `vercel_${Date.now()}`,
        deploymentUrl: vercelUrl,
        status: data.readyState === 'READY' ? 'ready' : 'deploying',
        buildLogSummary: `Submitted to Vercel (ID: ${data.id}).`,
      };
    } catch (err: any) {
      console.error('[VercelProvider] Error deploying to Vercel:', err);
      // Fallback to Managed
      const managedRes = await managedProvider.deploy(input);
      return {
        ...managedRes,
        buildLogSummary: `Vercel provider note (${err.message}). Defaulted to Remix Managed hosting.`,
      };
    }
  }

  async getStatus(providerDeploymentId: string): Promise<DeploymentStatusResult> {
    if (!this.isConfigured() || providerDeploymentId.startsWith('remix_')) {
      return managedProvider.getStatus(providerDeploymentId);
    }

    try {
      const urlParams = this.teamId ? `?teamId=${encodeURIComponent(this.teamId)}` : '';
      const response = await fetch(
        `https://api.vercel.com/v13/deployments/${providerDeploymentId}${urlParams}`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch Vercel deployment status.');
      }

      let status = 'deploying';
      if (data.readyState === 'READY') status = 'ready';
      if (data.readyState === 'ERROR') status = 'failed';
      if (data.readyState === 'CANCELED') status = 'cancelled';

      return {
        status: status as any,
        deploymentUrl: data.url ? `https://${data.url}` : undefined,
        buildLogSummary: `Vercel state: ${data.readyState}`,
      };
    } catch (err: any) {
      return {
        status: 'failed',
        error: err.message,
      };
    }
  }

  async unpublish(providerDeploymentId: string): Promise<void> {
    if (!this.isConfigured() || providerDeploymentId.startsWith('remix_')) {
      return managedProvider.unpublish(providerDeploymentId);
    }

    try {
      const urlParams = this.teamId ? `?teamId=${encodeURIComponent(this.teamId)}` : '';
      await fetch(
        `https://api.vercel.com/v13/deployments/${providerDeploymentId}${urlParams}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
    } catch (err) {
      console.warn('[VercelProvider] Failed to delete deployment on Vercel:', err);
    }
  }
}

export const vercelProvider = new VercelDeploymentProvider();
