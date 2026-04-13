import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "editor")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { cardId, title, content } = body;

  if (!cardId || !content?.trim()) {
    return NextResponse.json(
      { success: false, error: "cardId and content are required" },
      { status: 400 }
    );
  }

  const note = await prisma.note.create({
    data: {
      title: title?.trim() || null,
      content: content.trim(),
      cardId,
    },
  });

  await prisma.activity.create({
    data: {
      type: "note_updated",
      detail: `Note "${title || "Untitled"}" added`,
      cardId,
      userId: user.id,
    },
  });

  return NextResponse.json({ success: true, data: note });
}
