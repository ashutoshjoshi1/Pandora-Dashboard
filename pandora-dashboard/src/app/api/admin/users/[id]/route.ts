import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "admin")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { role, active, password, fullName, email } = body;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (role !== undefined) data.role = role;
  if (active !== undefined) data.active = active;
  if (fullName !== undefined) data.fullName = fullName;
  if (email !== undefined) data.email = email;
  if (password) data.passwordHash = await bcrypt.hash(password, 12);

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      role: true,
      active: true,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
