import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "editor")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { fieldId, value } = body;

  if (!fieldId) {
    return NextResponse.json({ success: false, error: "fieldId is required" }, { status: 400 });
  }

  const result = await prisma.cardCustomField.upsert({
    where: { cardId_fieldId: { cardId: id, fieldId } },
    update: { value },
    create: { cardId: id, fieldId, value },
  });

  await prisma.activity.create({
    data: {
      type: "field_changed",
      detail: `Custom field updated`,
      cardId: id,
      userId: user.id,
    },
  });

  return NextResponse.json({ success: true, data: result });
}
