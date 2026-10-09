import { DesignSpecification } from '../types';
import { UserGenerationConfig, WebsiteDefinition } from '../../src/types/website-definition';

export interface GenerationProvider {
  name: string;
  generateWebsite(
    spec: DesignSpecification,
    config: UserGenerationConfig
  ): Promise<WebsiteDefinition>;

  editWebsite(
    current: WebsiteDefinition,
    instruction: string
  ): Promise<WebsiteDefinition>;
}
