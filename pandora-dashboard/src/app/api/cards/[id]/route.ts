import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { notifyAdminsOfDeletion } from "@/lib/mail";

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
      jobs: { orderBy: { position: "asc" }, include: { user: { select: { id: true, fullName: true } } } },
      attachments: {
        include: { addedBy: { select: { id: true, fullName: true, username: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!card || card.deletedAt) {
    return NextResponse.json({ success: false, error: "Card not found" }, { status: 404 });
  }

  // Ensure ALL custom field definitions are represented on the card.
  // If a field definition exists but this card doesn't have a value for it,
  // create the row with null so it shows in the UI.
  const allFields = await prisma.customFieldDefinition.findMany();
  const existingFieldIds = new Set(card.customFields.map((cf) => cf.fieldId));
  const missingFields = allFields.filter((f) => !existingFieldIds.has(f.id));

  if (missingFields.length > 0) {
    await prisma.cardCustomField.createMany({
      data: missingFields.map((f) => ({
        cardId: id,
        fieldId: f.id,
        value: null,
      })),
    });

    // Re-fetch to get the complete set
    const updatedCard = await prisma.card.findUnique({
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

    return NextResponse.json({ success: true, data: updatedCard });
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
  const { title, description, status, priority, listId, dueDate } = body;

  const existing = await prisma.card.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
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
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    },
  });

  // Log activity
  const changes: string[] = [];
  if (title !== undefined && title !== existing.title) changes.push("title");
  if (description !== undefined && description !== existing.description) changes.push("description");
  if (status !== undefined && status !== existing.status) changes.push("status");
  if (priority !== undefined && priority !== existing.priority) changes.push("priority");
  if (dueDate !== undefined) changes.push("due date");
  if (listId !== undefined && listId !== existing.listId) changes.push("list");

  if (changes.length > 0) {
    await prisma.activity.create({
      data: {
        type: changes.includes("status")
          ? "status_changed"
          : changes.includes("description")
            ? "description_changed"
            : "card_updated",
        detail: `Updated ${changes.join(", ")}`,
        cardId: id,
        userId: user.id,
      },
    });
  }

  return NextResponse.json({ success: true, data: card });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "editor")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.card.findUnique({
    where: { id },
    include: { list: { include: { board: { include: { workspace: true } } } } },
  });
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ success: false, error: "Card not found" }, { status: 404 });
  }

  await prisma.card.update({
    where: { id },
    data: { deletedAt: new Date(), deletedBy: user.id },
  });

  const detail = `Card "${existing.title}" in ${existing.list.board.workspace.name} / ${existing.list.board.name} moved to trash`;

  await logActivity({
    action: "card_deleted",
    entityType: "card",
    entityId: id,
    entityName: existing.title,
    detail,
    userId: user.id,
  });

  notifyAdminsOfDeletion({
    entityType: "card",
    entityName: existing.title,
    deletedByName: user.fullName,
    detail: `Workspace: ${existing.list.board.workspace.name} / Board: ${existing.list.board.name}`,
  });

  return NextResponse.json({ success: true });
}
