import { DrainingService } from './draining.service';
import { DrainingDetectorOptions } from './interfaces/draining.interface';

/**
 * Module for rapid asset draining detection.
 * Provides balance monitoring, velocity analysis, and emergency alert generation.
 */
export class DrainingModule {
  static create(options: DrainingDetectorOptions = {}): DrainingService {
    return new DrainingService(options);
  }
}
