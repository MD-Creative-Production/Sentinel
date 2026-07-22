import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MultisigMonitoringService } from './multisig-monitoring.service';

describe('MultisigMonitoringService', () => {
  let service: MultisigMonitoringService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultisigMonitoringService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MultisigMonitoringService>(MultisigMonitoringService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should register and track multisig wallet configuration', () => {
    service.registerWallet({
      address: '0x1234',
      network: 'ethereum',
      threshold: 2,
      signers: ['0xA', '0xB'],
    });

    const config = service.getWalletConfig('0x1234');
    expect(config).toBeDefined();
    expect(config?.threshold).toBe(2);
  });

  it('should detect threshold changes and trigger a CRITICAL alert', async () => {
    service.registerWallet({
      address: '0x1234',
      network: 'ethereum',
      threshold: 2,
      signers: ['0xA', '0xB'],
    });

    await service.processActivity({
      multisigAddress: '0x1234',
      network: 'ethereum',
      type: 'THRESHOLD_CHANGED',
      txHash: '0xabc',
      oldThreshold: 2,
      newThreshold: 1,
    });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'multisig.alert',
      expect.objectContaining({
        severity: 'CRITICAL',
        title: '⚠️ Multisig Threshold Changed',
      }),
    );

    const updatedConfig = service.getWalletConfig('0x1234');
    expect(updatedConfig?.threshold).toBe(1);
  });
});
