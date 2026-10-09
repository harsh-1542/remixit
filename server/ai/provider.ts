import { WebsiteAnalysisInput, DesignSpecification } from '../types';

export interface VisionProvider {
  name: string;
  analyzeWebsite(input: WebsiteAnalysisInput): Promise<DesignSpecification>;
}
