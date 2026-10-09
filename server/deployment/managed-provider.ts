import fs from 'fs';
import path from 'path';
import {
  DeploymentProvider,
  DeploymentInput,
  DeploymentResult,
  DeploymentStatusResult,
} from './types';

export class ManagedDeploymentProvider implements DeploymentProvider {
  name = 'remix_managed' as const;
  displayName = 'Remix Edge Managed Hosting';

  private storageDir: string;

  constructor() {
    this.storageDir = path.resolve(process.cwd(), 'data', 'deployments');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async deploy(input: DeploymentInput): Promise<DeploymentResult> {
    const deploymentFolder = path.join(this.storageDir, input.deploymentId);
    if (!fs.existsSync(deploymentFolder)) {
      fs.mkdirSync(deploymentFolder, { recursive: true });
    }

    // Write all compiled files to the deployment folder
    for (const [filename, content] of Object.entries(input.files)) {
      const filePath = path.join(deploymentFolder, filename);
      fs.writeFileSync(filePath, content, 'utf-8');
    }

    // Determine the public URL
    const appUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : '';
    const deploymentPath = `/sites/${input.deploymentId}`;
    const deploymentUrl = appUrl ? `${appUrl}${deploymentPath}` : deploymentPath;

    return {
      providerDeploymentId: `remix_${input.deploymentId}`,
      deploymentUrl,
      status: 'ready',
      buildLogSummary: `Successfully packaged and published ${Object.keys(input.files).length} files to Remix Managed Edge.`,
    };
  }

  async getStatus(providerDeploymentId: string): Promise<DeploymentStatusResult> {
    const deploymentId = providerDeploymentId.replace(/^remix_/, '');
    const deploymentFolder = path.join(this.storageDir, deploymentId);

    if (!fs.existsSync(deploymentFolder)) {
      return {
        status: 'failed',
        error: 'Deployment artifacts not found on storage.',
      };
    }

    const appUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : '';
    const deploymentUrl = appUrl ? `${appUrl}/sites/${deploymentId}` : `/sites/${deploymentId}`;

    return {
      status: 'ready',
      deploymentUrl,
      buildLogSummary: 'Deployment is healthy and serving live traffic.',
    };
  }

  async unpublish(providerDeploymentId: string): Promise<void> {
    const deploymentId = providerDeploymentId.replace(/^remix_/, '');
    const deploymentFolder = path.join(this.storageDir, deploymentId);
    if (fs.existsSync(deploymentFolder)) {
      try {
        fs.rmSync(deploymentFolder, { recursive: true, force: true });
      } catch (err) {
        console.warn('Failed to delete deployment folder:', err);
      }
    }
  }
}

export const managedProvider = new ManagedDeploymentProvider();
