import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { notifyAdminsOfDeletion } from "@/lib/mail";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "admin")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.workspace.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  await prisma.workspace.update({
    where: { id },
    data: { deletedAt: new Date(), deletedBy: user.id },
  });

  const detail = `Workspace "${existing.name}" moved to trash`;

  await logActivity({
    action: "workspace_deleted",
    entityType: "workspace",
    entityId: id,
    entityName: existing.name,
    detail,
    userId: user.id,
  });

  notifyAdminsOfDeletion({
    entityType: "workspace",
    entityName: existing.name,
    deletedByName: user.fullName,
  });

  return NextResponse.json({ success: true });
}
