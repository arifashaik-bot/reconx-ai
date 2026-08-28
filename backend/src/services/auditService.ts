import { PrismaClient } from '@prisma/client';

export class AuditService {
  private static prisma = new PrismaClient();

  public static async log(action: string, details: string, runId?: string) {
    try {
      await this.prisma.auditLogEntry.create({
        data: {
          action,
          details,
          runId,
          timestamp: new Date(),
        },
      });
    } catch (err) {
      console.error('Failed to write audit log entry:', err);
    }
  }
}
