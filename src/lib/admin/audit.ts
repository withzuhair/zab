import type { Prisma } from "@/generated/prisma/client";

type AuditTransaction = Prisma.TransactionClient;

export async function writeAuditLog(
  transaction: AuditTransaction,
  input: {
    userId: string;
    action: "CREATE" | "UPDATE" | "DELETE";
    entity: string;
    entityId?: string;
    meta?: Prisma.InputJsonValue;
  },
) {
  await transaction.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      meta: input.meta,
    },
  });
}
