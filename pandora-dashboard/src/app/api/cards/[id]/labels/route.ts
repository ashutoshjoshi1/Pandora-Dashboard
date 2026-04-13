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

  const { id } = await params;
  const { labelId } = await request.json();

  if (!labelId) {
    return NextResponse.json(
      { success: false, error: "labelId is required" },
      { status: 400 }
    );
  }

  const card = await prisma.card.findUnique({ where: { id } });
  if (!card) {
    return NextResponse.json({ success: false, error: "Card not found" }, { status: 404 });
  }

  const existing = await prisma.cardLabel.findUnique({
    where: { cardId_labelId: { cardId: id, labelId } },
  });

  if (existing) {
    return NextResponse.json({ success: true, data: existing });
  }

  const cardLabel = await prisma.cardLabel.create({
    data: { cardId: id, labelId },
    include: { label: true },
  });

  await prisma.activity.create({
    data: {
      type: "label_added",
      detail: `Added label "${cardLabel.label.name}"`,
      cardId: id,
      userId: user.id,
    },
  });

  return NextResponse.json({ success: true, data: cardLabel }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "editor")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { labelId } = await request.json();

  if (!labelId) {
    return NextResponse.json(
      { success: false, error: "labelId is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.cardLabel.findUnique({
    where: { cardId_labelId: { cardId: id, labelId } },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Label not on card" }, { status: 404 });
  }

  const label = await prisma.label.findUnique({ where: { id: labelId } });

  await prisma.cardLabel.delete({
    where: { cardId_labelId: { cardId: id, labelId } },
  });

  await prisma.activity.create({
    data: {
      type: "label_removed",
      detail: `Removed label "${label?.name || "unknown"}"`,
      cardId: id,
      userId: user.id,
    },
  });

  return NextResponse.json({ success: true });
}
