import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "editor")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { id: cardId } = await params;
  const body = await request.json();
  const { jobId, completed } = body;

  if (!jobId || typeof completed !== "boolean") {
    return NextResponse.json({ success: false, error: "jobId and completed required" }, { status: 400 });
  }

  const job = await prisma.cardJob.findFirst({
    where: { id: jobId, cardId },
  });

  if (!job) {
    return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
  }

  const updated = await prisma.cardJob.update({
    where: { id: jobId },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
      completedBy: completed ? user.id : null,
    },
  });

  await prisma.activity.create({
    data: {
      type: "field_changed",
      detail: `${completed ? "Completed" : "Reopened"} job: ${job.name}`,
      cardId,
      userId: user.id,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
