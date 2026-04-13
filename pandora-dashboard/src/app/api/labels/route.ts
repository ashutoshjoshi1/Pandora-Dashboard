import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

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
