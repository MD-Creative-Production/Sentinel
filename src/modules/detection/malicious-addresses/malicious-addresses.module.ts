import { MaliciousAddressesService } from './malicious-addresses.service';

/**
 * Module wrapper for malicious address detection.
 * Provides static helper to instantiate the service.
 */
export class MaliciousAddressesModule {
  /**
   * Create and configure a MaliciousAddressesService instance.
   * @param useDefaults If true, initializes with default flagged addresses.
   */
  static create(useDefaults = true): MaliciousAddressesService {
    return new MaliciousAddressesService(useDefaults);
  }
}

/**
 * Factory helper function to instantiate the MaliciousAddressesService.
 * @param useDefaults If true, initializes with default flagged addresses.
 */
export function createMaliciousAddressesService(useDefaults = true): MaliciousAddressesService {
  return new MaliciousAddressesService(useDefaults);
}
