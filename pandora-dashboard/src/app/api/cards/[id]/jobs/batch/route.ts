import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "editor")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { id: cardId } = await params;
  const body = await request.json();
  const { jobs } = body;

  if (!Array.isArray(jobs) || jobs.length === 0) {
    return NextResponse.json({ success: false, error: "Jobs array required" }, { status: 400 });
  }

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) {
    return NextResponse.json({ success: false, error: "Card not found" }, { status: 404 });
  }

  const data = jobs.map((name: string, index: number) => ({
    cardId,
    name,
    position: index,
  }));

  await prisma.cardJob.createMany({ data });

  return NextResponse.json({ success: true });
}
