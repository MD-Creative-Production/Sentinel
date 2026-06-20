import { InvestigationService } from './investigation.service';

/**
 * Module for AI-powered investigation assistance.
 * Provides incident context generation, related event suggestions, and timeline analysis.
 */
export class InvestigationModule {
  /**
   * Create and configure the investigation service.
   * Returns a ready-to-use InvestigationService instance.
   */
  static create(): InvestigationService {
    return new InvestigationService();
  }
}
