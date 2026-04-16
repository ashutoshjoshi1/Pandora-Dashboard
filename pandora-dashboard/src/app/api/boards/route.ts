import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "admin")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, workspaceId } = body;

  if (!name?.trim() || !workspaceId) {
    return NextResponse.json(
      { success: false, error: "name and workspaceId are required" },
      { status: 400 }
    );
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace || workspace.deletedAt) {
    return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  let slug = slugify(name);
  const existing = await prisma.board.findUnique({
    where: { workspaceId_slug: { workspaceId, slug } },
  });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const lastBoard = await prisma.board.findFirst({
    where: { workspaceId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const board = await prisma.board.create({
    data: {
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      workspaceId,
      position: (lastBoard?.position ?? -1) + 1,
    },
  });

  return NextResponse.json({ success: true, data: board }, { status: 201 });
}
