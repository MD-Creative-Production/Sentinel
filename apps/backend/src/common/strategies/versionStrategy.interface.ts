import { Request } from 'express';

export type ApiVersion = 'v1' | 'v2';

export interface IVersionResolverStrategy {
  readonly name: string;
  resolve(req: Request): ApiVersion | null;
}
