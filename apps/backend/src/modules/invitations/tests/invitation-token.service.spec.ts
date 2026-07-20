import { InvitationTokenService } from '../services/invitation-token.service';

describe('InvitationTokenService', () => {
  let service: InvitationTokenService;

  beforeEach(() => {
    service = new InvitationTokenService();
  });

  it('generates a unique token on each call', () => {
    const a = service.generate();
    const b = service.generate();
    expect(a).not.toEqual(b);
    expect(a).toHaveLength(64); // 32 random bytes, hex-encoded
  });

  it('hashes deterministically for the same input', () => {
    const token = service.generate();
    expect(service.hash(token)).toEqual(service.hash(token));
  });

  it('produces different hashes for different tokens', () => {
    const a = service.generate();
    const b = service.generate();
    expect(service.hash(a)).not.toEqual(service.hash(b));
  });

  it('never returns the raw token as its own hash', () => {
    const token = service.generate();
    expect(service.hash(token)).not.toEqual(token);
  });
});
