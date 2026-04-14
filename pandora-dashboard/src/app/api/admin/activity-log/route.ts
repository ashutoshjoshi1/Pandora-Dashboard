import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user || !requireRole(user.role, "admin")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const logs = await prisma.activityLog.findMany({
    include: {
      user: { select: { id: true, fullName: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ success: true, data: logs });
}
