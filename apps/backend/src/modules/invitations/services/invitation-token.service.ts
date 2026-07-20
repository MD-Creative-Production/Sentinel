import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

const TOKEN_BYTES = 32;

@Injectable()
export class InvitationTokenService {
  generate(): string {
    return randomBytes(TOKEN_BYTES).toString('hex');
  }

  hash(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
