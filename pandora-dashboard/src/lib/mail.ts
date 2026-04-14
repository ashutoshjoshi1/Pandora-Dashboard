import nodemailer from "nodemailer";
import { prisma } from "./db";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_ADDRESS = process.env.SMTP_FROM || "pandora-dashboard@sciglob.com";

async function getAdminEmails(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: "admin", active: true },
    select: { email: true },
  });
  return admins.map((a) => a.email);
}

export async function notifyAdminsOfDeletion({
  entityType,
  entityName,
  deletedByName,
  detail,
}: {
  entityType: "card" | "workspace";
  entityName: string;
  deletedByName: string;
  detail?: string;
}) {
  if (!process.env.SMTP_USER) {
    console.warn("[Mail] SMTP not configured — skipping admin notification");
    return;
  }

  const adminEmails = await getAdminEmails();
  if (adminEmails.length === 0) return;

  const subject = `[Pandora] ${entityType === "card" ? "Card" : "Workspace"} deleted: ${entityName}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px;">
        <h2 style="margin: 0 0 8px; font-size: 16px; color: #991b1b;">
          ${entityType === "card" ? "Card" : "Workspace"} Moved to Trash
        </h2>
        <p style="margin: 0 0 12px; font-size: 14px; color: #5f5e5a;">
          <strong>${deletedByName}</strong> deleted the ${entityType} <strong>&ldquo;${entityName}&rdquo;</strong>.
        </p>
        ${detail ? `<p style="margin: 0 0 12px; font-size: 13px; color: #888780;">${detail}</p>` : ""}
        <p style="margin: 0; font-size: 13px; color: #888780;">
          This item has been moved to the Trash and can be restored by an admin from the Trash page.
        </p>
      </div>
      <p style="margin: 16px 0 0; font-size: 11px; color: #b4b2a9; text-align: center;">
        Pandora Dashboard &middot; SciGlob Instruments &amp; Services
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: adminEmails.join(", "),
      subject,
      html,
    });
  } catch (err) {
    console.error("[Mail] Failed to send admin notification:", err);
  }
}
