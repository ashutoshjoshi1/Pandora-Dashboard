import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { fullName, email } = await request.json();

  const data: Record<string, string> = {};
  if (fullName?.trim()) data.fullName = fullName.trim();
  if (email?.trim()) data.email = email.trim();

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ success: false, error: "No changes provided" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { id: true, username: true, fullName: true, email: true, role: true },
  });

  return NextResponse.json({ success: true, data: updated });
}
