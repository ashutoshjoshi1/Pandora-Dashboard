import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "admin")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { entityType, entityId } = await request.json();

  if (!entityType || !entityId) {
    return NextResponse.json(
      { success: false, error: "entityType and entityId are required" },
      { status: 400 }
    );
  }

  if (entityType === "card") {
    const card = await prisma.card.findUnique({ where: { id: entityId } });
    if (!card || !card.deletedAt) {
      return NextResponse.json({ success: false, error: "Card not found in trash" }, { status: 404 });
    }

    await prisma.card.update({
      where: { id: entityId },
      data: { deletedAt: null, deletedBy: null },
    });

    await logActivity({
      action: "card_restored",
      entityType: "card",
      entityId,
      entityName: card.title,
      detail: `Card "${card.title}" restored from trash`,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  }

  if (entityType === "workspace") {
    const workspace = await prisma.workspace.findUnique({ where: { id: entityId } });
    if (!workspace || !workspace.deletedAt) {
      return NextResponse.json({ success: false, error: "Workspace not found in trash" }, { status: 404 });
    }

    await prisma.workspace.update({
      where: { id: entityId },
      data: { deletedAt: null, deletedBy: null },
    });

    await logActivity({
      action: "workspace_restored",
      entityType: "workspace",
      entityId,
      entityName: workspace.name,
      detail: `Workspace "${workspace.name}" restored from trash`,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: "Invalid entityType" }, { status: 400 });
}
