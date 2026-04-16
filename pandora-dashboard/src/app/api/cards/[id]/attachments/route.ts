import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const attachments = await prisma.cardAttachment.findMany({
    where: { cardId: id },
    include: { addedBy: { select: { id: true, fullName: true, username: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: attachments });
}

function detectGoogleDocType(url: string): string {
  if (url.includes("docs.google.com/document")) return "google_doc";
  if (url.includes("docs.google.com/spreadsheets")) return "google_sheet";
  if (url.includes("docs.google.com/presentation")) return "google_slide";
  if (url.includes("drive.google.com")) return "google_drive";
  return "link";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "editor")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, url } = body;

  if (!name?.trim() || !url?.trim()) {
    return NextResponse.json(
      { success: false, error: "name and url are required" },
      { status: 400 }
    );
  }

  const card = await prisma.card.findUnique({ where: { id } });
  if (!card || card.deletedAt) {
    return NextResponse.json({ success: false, error: "Card not found" }, { status: 404 });
  }

  const type = detectGoogleDocType(url.trim());

  const attachment = await prisma.cardAttachment.create({
    data: {
      cardId: id,
      name: name.trim(),
      url: url.trim(),
      type,
      addedById: user.id,
    },
    include: { addedBy: { select: { id: true, fullName: true, username: true } } },
  });

  await prisma.activity.create({
    data: {
      type: "attachment_added",
      detail: `Attached "${name.trim()}" (${type.replace("_", " ")})`,
      cardId: id,
      userId: user.id,
    },
  });

  return NextResponse.json({ success: true, data: attachment }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "editor")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { attachmentId } = await request.json();

  if (!attachmentId) {
    return NextResponse.json({ success: false, error: "attachmentId is required" }, { status: 400 });
  }

  const attachment = await prisma.cardAttachment.findUnique({ where: { id: attachmentId } });
  if (!attachment || attachment.cardId !== id) {
    return NextResponse.json({ success: false, error: "Attachment not found" }, { status: 404 });
  }

  await prisma.cardAttachment.delete({ where: { id: attachmentId } });

  await prisma.activity.create({
    data: {
      type: "attachment_removed",
      detail: `Removed attachment "${attachment.name}"`,
      cardId: id,
      userId: user.id,
    },
  });

  return NextResponse.json({ success: true });
}
