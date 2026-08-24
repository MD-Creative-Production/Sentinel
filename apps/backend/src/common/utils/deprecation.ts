import { Response } from 'express';

export interface DeprecationOptions {
  sunsetDate: string; // RFC 1123 format e.g., "Sun, 31 Dec 2028 23:59:59 GMT"
  successorVersion?: string;
}

export function setDeprecationHeaders(res: Response, options: DeprecationOptions): void {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', options.sunsetDate);
  if (options.successorVersion) {
    res.setHeader('Link', `<${options.successorVersion}>; rel="successor-version"`);
  }
}
