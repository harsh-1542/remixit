import { WebsiteDefinition } from '../../src/types/website-definition';
import { DeploymentRecord, DeploymentStatus, DeploymentProviderType } from '../db/types';

export interface DeploymentInput {
  deploymentId: string;
  projectId: string;
  userId: string;
  versionNumber: number;
  websiteDefinition: WebsiteDefinition;
  files: Record<string, string>;
  description?: string;
}

export interface DeploymentResult {
  providerDeploymentId: string;
  deploymentUrl: string;
  status: DeploymentStatus;
  buildLogSummary: string;
}

export interface DeploymentStatusResult {
  status: DeploymentStatus;
  deploymentUrl?: string;
  buildLogSummary?: string;
  error?: string;
}

export interface DeploymentProvider {
  name: DeploymentProviderType;
  displayName: string;
  deploy(input: DeploymentInput): Promise<DeploymentResult>;
  getStatus(providerDeploymentId: string): Promise<DeploymentStatusResult>;
  unpublish?(providerDeploymentId: string): Promise<void>;
}

export interface DeploymentJob {
  id: string;
  deploymentId: string;
  projectId: string;
  userId: string;
  versionId: string;
  versionNumber: number;
  provider: DeploymentProviderType;
  status: DeploymentStatus;
  progress: number;
  currentStage: string;
  deploymentUrl?: string;
  buildLogSummary?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}
