export class CreateApiKeyDto {
  name!: string;
}

export class ApiKeyResponseDto {
  id!: string;
  name!: string;
  key?: string; // Only returned on creation
  keyPreview!: string; // Last 4 chars
  createdAt!: Date;
  lastUsedAt!: Date | null;
  revokedAt!: Date | null;
}

export class ApiKeyUsageDto {
  id!: string;
  name!: string;
  keyPreview!: string;
  createdAt!: Date;
  lastUsedAt!: Date | null;
  requestCount!: number;
}
