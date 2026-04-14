import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "editor")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { cardId, sourceListId, destinationListId, newPosition } =
    await request.json();

  if (!cardId || destinationListId === undefined || newPosition === undefined) {
    return NextResponse.json(
      { success: false, error: "cardId, destinationListId, and newPosition are required" },
      { status: 400 }
    );
  }

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card || card.deletedAt) {
    return NextResponse.json({ success: false, error: "Card not found" }, { status: 404 });
  }

  const movedBetweenLists = sourceListId !== destinationListId;

  // Shift positions in destination list to make room
  await prisma.card.updateMany({
    where: {
      listId: destinationListId,
      position: { gte: newPosition },
      id: { not: cardId },
    },
    data: { position: { increment: 1 } },
  });

  // Move the card
  await prisma.card.update({
    where: { id: cardId },
    data: {
      listId: destinationListId,
      position: newPosition,
    },
  });

  // Compact positions in old list if card moved between lists
  if (movedBetweenLists) {
    const oldListCards = await prisma.card.findMany({
      where: { listId: sourceListId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    for (let i = 0; i < oldListCards.length; i++) {
      await prisma.card.update({
        where: { id: oldListCards[i].id },
        data: { position: i },
      });
    }

    const sourceName = await prisma.boardList.findUnique({
      where: { id: sourceListId },
      select: { name: true },
    });
    const destName = await prisma.boardList.findUnique({
      where: { id: destinationListId },
      select: { name: true },
    });

    await prisma.activity.create({
      data: {
        type: "card_moved",
        detail: `Moved from "${sourceName?.name}" to "${destName?.name}"`,
        cardId,
        userId: user.id,
      },
    });
  }

  return NextResponse.json({ success: true });
}
