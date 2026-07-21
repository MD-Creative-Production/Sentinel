import { HighFrequencyContractCallsService } from './high-frequency-calls.service';
import { FrequencyThresholdConfig } from './interfaces/high-frequency-calls.interface';

/**
 * Module wrapper for high-frequency contract call detection.
 * Provides a static helper to instantiate the service.
 */
export class HighFrequencyContractCallsModule {
  /** Create and configure a HighFrequencyContractCallsService instance. */
  static create(defaultThreshold?: FrequencyThresholdConfig): HighFrequencyContractCallsService {
    return new HighFrequencyContractCallsService(defaultThreshold);
  }
}

/** Factory helper function to instantiate the HighFrequencyContractCallsService. */
export function createHighFrequencyContractCallsService(
  defaultThreshold?: FrequencyThresholdConfig,
): HighFrequencyContractCallsService {
  return new HighFrequencyContractCallsService(defaultThreshold);
}
