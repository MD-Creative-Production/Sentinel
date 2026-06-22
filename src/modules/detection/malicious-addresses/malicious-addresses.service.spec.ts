import { MaliciousAddressesService } from './malicious-addresses.service';
import { FeedUpdate, MaliciousAddressAlert } from './interfaces/malicious-addresses.interface';

describe('MaliciousAddressesService', () => {
  let service: MaliciousAddressesService;

  beforeEach(() => {
    // Create service without default addresses for custom test setups
    service = new MaliciousAddressesService(false);
  });

  describe('Address Normalization and Matching', () => {
    it('should match exact addresses', () => {
      service.addAddresses('TestFeed', [
        {
          address: 'GA5Z3J2ABCDEFGHIJKLMNO1234567890STUVWXYZ',
          reason: 'Phishing',
          severity: 'high',
          flaggedAt: '2026-06-21T00:00:00.000Z',
        },
      ]);

      const match = service.matchAddress('GA5Z3J2ABCDEFGHIJKLMNO1234567890STUVWXYZ');
      expect(match.isMatched).toBe(true);
      expect(match.address).toBe('GA5Z3J2ABCDEFGHIJKLMNO1234567890STUVWXYZ');
      expect(match.matchedRecord?.feedName).toBe('TestFeed');
      expect(match.matchedRecord?.severity).toBe('high');
    });

    it('should normalize and match EVM hex addresses case-insensitively', () => {
      service.addAddresses('TestFeed', [
        {
          address: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
          reason: 'Drainer',
          severity: 'critical',
          flaggedAt: '2026-06-21T00:00:00.000Z',
        },
      ]);

      // Check with lowercase
      const matchLower = service.matchAddress('0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5');
      expect(matchLower.isMatched).toBe(true);

      // Check with uppercase
      const matchUpper = service.matchAddress('0x95222290DD7278AA3DDD389CC1E1D165CC4BAFE5');
      expect(matchUpper.isMatched).toBe(true);
    });

    it('should return isMatched false for unknown addresses', () => {
      const match = service.matchAddress('0x0000000000000000000000000000000000000000');
      expect(match.isMatched).toBe(false);
      expect(match.matchedRecord).toBeUndefined();
    });

    it('should check a batch of addresses', () => {
      service.addAddresses('TestFeed', [
        {
          address: '0x123',
          reason: 'Bad',
          severity: 'low',
          flaggedAt: '2026-06-21T00:00:00.000Z',
        },
      ]);

      const results = service.checkAddresses(['0x123', '0x456']);
      expect(results.length).toBe(2);
      expect(results[0].isMatched).toBe(true);
      expect(results[1].isMatched).toBe(false);
    });
  });

  describe('Default Addresses Initialization', () => {
    it('should initialize default addresses when useDefaults is true', () => {
      const defaultService = new MaliciousAddressesService(true);
      const flagged = defaultService.getFlaggedAddresses();
      expect(flagged.length).toBeGreaterThan(0);

      // Check default EVM address
      const evmMatch = defaultService.matchAddress('0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5');
      expect(evmMatch.isMatched).toBe(true);
      expect(evmMatch.matchedRecord?.feedName).toBe('PhishGuard');

      // Check default Stellar address
      const stellarMatch = defaultService.matchAddress('GA5Z3J2ABCDEFGHIJKLMNO1234567890STUVWXYZ');
      expect(stellarMatch.isMatched).toBe(true);
      expect(stellarMatch.matchedRecord?.feedName).toBe('StellarThreatFeed');
    });
  });

  describe('Feed Integration and Syncing', () => {
    it('should update and overwrite feed addresses', () => {
      // First, add initial feed records
      service.addAddresses('MyFeed', [
        {
          address: '0x111',
          reason: 'Reason 1',
          severity: 'medium',
          flaggedAt: '2026-06-21T00:00:00.000Z',
        },
      ]);

      expect(service.matchAddress('0x111').isMatched).toBe(true);

      // Now sync feed update that replaces '0x111' with '0x222'
      const feedUpdate: FeedUpdate = {
        feedName: 'MyFeed',
        addresses: [
          {
            address: '0x222',
            reason: 'Reason 2',
            severity: 'high',
            flaggedAt: '2026-06-21T01:00:00.000Z',
          },
        ],
      };

      service.updateFeed(feedUpdate);

      // Old address should be cleared
      expect(service.matchAddress('0x111').isMatched).toBe(false);
      // New address should be added
      expect(service.matchAddress('0x222').isMatched).toBe(true);
      expect(service.matchAddress('0x222').matchedRecord?.reason).toBe('Reason 2');
    });

    it('should clear all addresses associated with a feed', () => {
      service.addAddresses('FeedA', [
        { address: '0xaaa', reason: 'A', severity: 'low', flaggedAt: '' },
      ]);
      service.addAddresses('FeedB', [
        { address: '0xbbb', reason: 'B', severity: 'low', flaggedAt: '' },
      ]);

      expect(service.getFlaggedAddresses().length).toBe(2);

      service.clearFeed('FeedA');

      expect(service.matchAddress('0xaaa').isMatched).toBe(false);
      expect(service.matchAddress('0xbbb').isMatched).toBe(true);
      expect(service.getFlaggedAddresses().length).toBe(1);
    });
  });

  describe('Transaction Checking and Alert Generation', () => {
    beforeEach(() => {
      service.addAddresses('ThreatFeed', [
        {
          address: '0xbadaddress',
          reason: 'Exploiter contract',
          severity: 'critical',
          flaggedAt: '2026-06-21T00:00:00.000Z',
        },
      ]);
    });

    it('should detect a flagged address in the "from" field', () => {
      const tx = { from: '0xbadaddress', to: '0xsafeaddress', hash: 'tx-001' };
      const alert = service.checkTransaction(tx);

      expect(alert).not.toBeNull();
      expect(alert?.severity).toBe('critical');
      expect(alert?.metadata.matchedAddress).toBe('0xbadaddress');
      expect(alert?.metadata.feedName).toBe('ThreatFeed');
      expect(alert?.metadata.transactionDetails?.hash).toBe('tx-001');
      expect(alert?.metadata.transactionDetails?.field).toBe('from');
    });

    it('should detect a flagged address in the "to" field', () => {
      const tx = { from: '0xsafeaddress', to: '0xbadaddress', hash: 'tx-002' };
      const alert = service.checkTransaction(tx);

      expect(alert).not.toBeNull();
      expect(alert?.metadata.matchedAddress).toBe('0xbadaddress');
      expect(alert?.metadata.transactionDetails?.field).toBe('to');
    });

    it('should detect a flagged address in the "contractAddress" field', () => {
      const tx = {
        from: '0xsafe1',
        to: '0xsafe2',
        contractAddress: '0xbadaddress',
        hash: 'tx-003',
      };
      const alert = service.checkTransaction(tx);

      expect(alert).not.toBeNull();
      expect(alert?.metadata.matchedAddress).toBe('0xbadaddress');
      expect(alert?.metadata.transactionDetails?.field).toBe('contractAddress');
    });

    it('should return null if no flagged addresses are involved', () => {
      const tx = { from: '0xsafe1', to: '0xsafe2', contractAddress: '0xsafe3' };
      const alert = service.checkTransaction(tx);

      expect(alert).toBeNull();
    });

    it('should dispatch generated alerts to subscribers', () => {
      const alertList: MaliciousAddressAlert[] = [];
      const unsubscribe = service.onAlert(alert => {
        alertList.push(alert);
      });

      const tx = { from: '0xbadaddress', to: '0xsafeaddress' };
      service.checkTransaction(tx);

      expect(alertList.length).toBe(1);
      expect(alertList[0].metadata.matchedAddress).toBe('0xbadaddress');

      // Test unsubscribe
      unsubscribe();
      service.checkTransaction(tx);
      expect(alertList.length).toBe(1); // Length should not increase
    });
  });
});
