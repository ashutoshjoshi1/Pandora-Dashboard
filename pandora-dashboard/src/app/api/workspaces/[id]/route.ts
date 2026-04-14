import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";

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
  if (!existing) {
    return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  await prisma.workspace.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
