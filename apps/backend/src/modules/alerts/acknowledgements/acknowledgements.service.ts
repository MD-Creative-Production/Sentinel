import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AcknowledgeAlertDto } from './dto/acknowledge-alert.dto';

@Injectable()
export class AcknowledgementsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Acknowledges an alert and generates an audit log entry.
   * Proactively optimizes for time and space complexity by using a Prisma
   * transaction to ensure both the alert update and audit log creation
   * are executed atomically, avoiding partial states and reducing database round trips.
   *
   * @param alertId The ID of the alert to acknowledge
   * @param dto The acknowledgement details (reviewerId, reviewerName)
   * @returns The updated alert
   */
  async acknowledgeAlert(alertId: string, dto: AcknowledgeAlertDto) {
    // Check if the alert exists first to provide a clear error message
    const alert = await this.prisma.alert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${alertId} not found`);
    }

    if (alert.acknowledgedAt) {
      throw new BadRequestException(`Alert with ID ${alertId} is already acknowledged`);
    }

    const now = new Date();

    // Execute within a transaction for atomicity and performance
    const [updatedAlert] = await this.prisma.$transaction([
      this.prisma.alert.update({
        where: { id: alertId },
        data: {
          acknowledgedAt: now,
          acknowledgedBy: dto.reviewerId,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          userId: dto.reviewerId,
          action: 'ALERT_ACKNOWLEDGED',
          actor: dto.reviewerName,
          metadata: {
            alertId: alertId,
            timestamp: now.toISOString(),
          },
        },
      }),
    ]);

    return updatedAlert;
  }
}
