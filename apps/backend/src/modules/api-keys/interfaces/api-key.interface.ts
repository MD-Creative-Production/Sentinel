export interface IApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  keyHash: string;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}
