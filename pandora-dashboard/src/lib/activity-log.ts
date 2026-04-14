import { prisma } from "./db";

export async function logActivity({
  action,
  entityType,
  entityId,
  entityName,
  detail,
  userId,
}: {
  action: string;
  entityType: "card" | "workspace";
  entityId: string;
  entityName: string;
  detail: string;
  userId?: string | null;
}) {
  return prisma.activityLog.create({
    data: {
      action,
      entityType,
      entityId,
      entityName,
      detail,
      userId: userId ?? undefined,
    },
  });
}
