import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const card = await prisma.card.findUnique({
    where: { id },
    include: {
      labels: { include: { label: true } },
      customFields: { include: { field: true } },
      comments: {
        include: { author: { select: { id: true, fullName: true, username: true } } },
        orderBy: { createdAt: "desc" },
      },
      notes: { orderBy: { createdAt: "desc" } },
      activities: {
        include: { user: { select: { id: true, fullName: true, username: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      list: { include: { board: { include: { workspace: true } } } },
    },
  });

  if (!card) {
    return NextResponse.json({ success: false, error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: card });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "editor")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { title, description, status, priority, listId } = body;

  const existing = await prisma.card.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Card not found" }, { status: 404 });
  }

  const card = await prisma.card.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(listId !== undefined && { listId }),
    },
  });

  // Log activity
  const changes: string[] = [];
  if (title !== undefined && title !== existing.title) changes.push("title");
  if (description !== undefined && description !== existing.description) changes.push("description");
  if (status !== undefined && status !== existing.status) changes.push("status");
  if (listId !== undefined && listId !== existing.listId) changes.push("list");

  if (changes.length > 0) {
    await prisma.activity.create({
      data: {
        type: changes.includes("status") ? "status_changed" : changes.includes("description") ? "description_changed" : "card_updated",
        detail: `Updated ${changes.join(", ")}`,
        cardId: id,
        userId: user.id,
      },
    });
  }

  return NextResponse.json({ success: true, data: card });
}
