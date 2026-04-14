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
  const { name, description, color, icon } = body;

  if (!name?.trim()) {
    return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
  }

  let slug = slugify(name);

  // Ensure unique slug
  const existing = await prisma.workspace.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      color: color || "#3266ad",
      icon: icon || null,
    },
  });

  // Grant the creator access
  await prisma.userWorkspaceAccess.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      role: "admin",
    },
  });

  // Create a default board
  await prisma.board.create({
    data: {
      name: "Instrument Tracking",
      slug: "instrument-tracking",
      description: "Main instrument tracking board",
      workspaceId: workspace.id,
    },
  });

  return NextResponse.json({ success: true, data: workspace });
}
