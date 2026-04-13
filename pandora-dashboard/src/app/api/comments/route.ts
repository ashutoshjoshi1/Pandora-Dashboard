import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { cardId, content } = body;

  if (!cardId || !content?.trim()) {
    return NextResponse.json(
      { success: false, error: "cardId and content are required" },
      { status: 400 }
    );
  }

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      cardId,
      authorId: user.id,
    },
    include: {
      author: { select: { id: true, fullName: true, username: true } },
    },
  });

  await prisma.activity.create({
    data: {
      type: "comment_added",
      detail: `Comment added by ${user.fullName}`,
      cardId,
      userId: user.id,
    },
  });

  return NextResponse.json({ success: true, data: comment });
}
