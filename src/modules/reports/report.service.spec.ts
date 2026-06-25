import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { EmailService } from './email.service';

describe('ReportService', () => {
  let service: ReportService;
  let emailService: EmailService;

  beforeEach(async () => {
    const mockEmailService = {
      sendReport: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate daily report content', async () => {
    const report = await service.generateDailyReport();
    expect(report).toContain('Daily security summary placeholder');
  });

  it('should generate weekly report content', async () => {
    const report = await service.generateWeeklyReport();
    expect(report).toContain('Weekly security summary placeholder');
  });

  it('should deliver report via EmailService', async () => {
    const content = 'Test Content';
    const subject = 'Test Subject';
    await service.deliverReport(content, subject);
    expect(emailService.sendReport).toHaveBeenCalledWith(content, subject);
  });
});
