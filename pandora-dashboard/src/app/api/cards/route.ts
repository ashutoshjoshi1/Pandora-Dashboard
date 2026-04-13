import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "editor")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, listId } = body;

  if (!title?.trim() || !listId) {
    return NextResponse.json(
      { success: false, error: "title and listId are required" },
      { status: 400 }
    );
  }

  // Get highest position in the list
  const lastCard = await prisma.card.findFirst({
    where: { listId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const nextPosition = (lastCard?.position ?? -1) + 1;

  // Create the card
  const card = await prisma.card.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      listId,
      position: nextPosition,
    },
  });

  // Attach ALL custom field definitions to this card (empty values)
  const allFields = await prisma.customFieldDefinition.findMany();
  if (allFields.length > 0) {
    await prisma.cardCustomField.createMany({
      data: allFields.map((f) => ({
        cardId: card.id,
        fieldId: f.id,
        value: null,
      })),
    });
  }

  // Log activity
  await prisma.activity.create({
    data: {
      type: "card_created",
      detail: `Card "${title.trim()}" created`,
      cardId: card.id,
      userId: user.id,
    },
  });

  return NextResponse.json({ success: true, data: card }, { status: 201 });
}
