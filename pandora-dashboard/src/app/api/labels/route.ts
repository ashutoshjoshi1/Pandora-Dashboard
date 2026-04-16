import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const labels = await prisma.label.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ success: true, data: labels });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "admin")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { name, color } = await request.json();

  if (!name?.trim() || !color?.trim()) {
    return NextResponse.json({ success: false, error: "name and color are required" }, { status: 400 });
  }

  const label = await prisma.label.create({
    data: { name: name.trim(), color: color.trim() },
  });

  return NextResponse.json({ success: true, data: label }, { status: 201 });
}
