import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.EMAIL_FROM ?? "GreenBroker <noreply@greenbroker.com>";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

/**
 * Base email send function — wraps Resend with error handling + logging.
 */
export async function sendEmail(options: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    text: options.text,
    html: options.html ?? textToHtml(options.text),
    reply_to: options.replyTo,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
}

// ─── Assessment Confirmation ──────────────────────────────────────────────────

export async function sendAssessmentConfirmationEmail({
  email,
  firstName,
  assessmentId,
  estimatedRebates,
  estimatedSavings,
}: {
  email: string;
  firstName?: string;
  assessmentId: string;
  estimatedRebates: number;
  estimatedSavings: number;
}) {
  const name = firstName ?? "there";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #111827; background: #fff;">
  <div style="margin-bottom: 32px;">
    <span style="font-size: 28px;">🌿</span>
    <span style="font-size: 20px; font-weight: 700; color: #16a34a; margin-left: 8px;">GreenBroker</span>
  </div>

  <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 16px;">Your energy assessment is saved, ${name}!</h1>

  <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px;">
    Based on your home profile, here's a quick summary of your energy opportunity in Rockville, MD:
  </p>

  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
      <div>
        <div style="font-size: 28px; font-weight: 700; color: #16a34a;">$${estimatedRebates.toLocaleString()}</div>
        <div style="font-size: 13px; color: #15803d;">Estimated available rebates</div>
      </div>
      <div>
        <div style="font-size: 28px; font-weight: 700; color: #1d4ed8;">$${estimatedSavings.toLocaleString()}/yr</div>
        <div style="font-size: 13px; color: #1e40af;">Potential annual savings</div>
      </div>
    </div>
    <p style="font-size: 12px; color: #166534; margin: 0;">
      * Estimates based on your home profile. Actual amounts depend on installed equipment and income verification.
    </p>
  </div>

  <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 0 0 24px;">
    <p style="font-size: 13px; color: #92400e; margin: 0; font-weight: 600;">⚠️ Federal tax credits were eliminated January 1, 2026</p>
    <p style="font-size: 13px; color: #92400e; margin: 8px 0 0;">
      The 30% solar and home improvement credits no longer apply. Your estimate reflects current Maryland and county programs only.
    </p>
  </div>

  <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 12px;">Your recommended next steps:</h2>
  <ol style="color: #4b5563; line-height: 1.8; padding-left: 20px; margin: 0 0 24px;">
    <li><strong>LEDs now</strong> — $100 investment, 2.5-month payback, $485/year savings</li>
    <li><strong>Book a free energy checkup</strong> — PEPCO's Quick Home Energy Checkup is free and identifies the biggest opportunities</li>
    <li><strong>Get solar quotes</strong> — Maryland MSAP grants and SRECs make solar compelling even without the federal credit</li>
    <li><strong>Get heat pump quotes</strong> — When your HVAC needs replacement, EmPOWER covers up to $15,000</li>
  </ol>

  <a href="${appUrl}/dashboard?assessment=${assessmentId}"
     style="display: inline-block; background: #16a34a; color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 0 0 32px;">
    View My Full Plan →
  </a>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
  <p style="font-size: 12px; color: #9ca3af; margin: 0;">
    GreenBroker · Rockville, MD energy efficiency platform ·
    <a href="${appUrl}/unsubscribe" style="color: #9ca3af;">Unsubscribe</a>
  </p>
</body>
</html>
  `.trim();

  return sendEmail({
    to: email,
    subject: `Your GreenBroker energy plan — $${estimatedRebates.toLocaleString()} in available rebates`,
    text: `Hi ${name}!\n\nYour energy assessment has been saved.\n\nEstimated rebates available: $${estimatedRebates.toLocaleString()}\nEstimated annual savings: $${estimatedSavings.toLocaleString()}/year\n\nView your full plan: ${appUrl}/dashboard?assessment=${assessmentId}\n\n—GreenBroker`,
    html,
  });
}

// ─── Lead Notification ────────────────────────────────────────────────────────

export async function sendLeadNotificationEmail({
  contractorId,
  leadId,
  assessmentId,
}: {
  contractorId: string;
  leadId: string;
  assessmentId: string;
}) {
  const adminClient = createAdminClient();

  // Get contractor contact info
  const { data: contractor } = await adminClient
    .from("contractors")
    .select("business_name, profiles(email, first_name)")
    .eq("id", contractorId)
    .single();

  if (!contractor) return;

  const profile = (contractor as any).profiles;
  if (!profile?.email) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #111827;">
  <div style="margin-bottom: 24px;">
    <span style="font-size: 28px;">🌿</span>
    <span style="font-size: 20px; font-weight: 700; color: #16a34a; margin-left: 8px;">GreenBroker</span>
  </div>

  <div style="background: #dcfce7; border-left: 4px solid #16a34a; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 0 0 24px;">
    <p style="font-size: 18px; font-weight: 700; color: #14532d; margin: 0;">🎯 New lead purchased!</p>
  </div>

  <p style="color: #4b5563; line-height: 1.6;">
    Hi ${profile.first_name ?? "there"}, a new qualified homeowner lead is ready in your dashboard.
    Log in to view full contact details and project scope.
  </p>

  <a href="${appUrl}/dashboard/contractor/leads/${leadId}"
     style="display: inline-block; background: #16a34a; color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px;">
    View Lead Details →
  </a>

  <p style="font-size: 13px; color: #9ca3af; margin-top: 32px;">
    You received this email because you purchased lead ${leadId} on GreenBroker.
  </p>
</body>
</html>
  `.trim();

  return sendEmail({
    to: profile.email,
    subject: `🎯 New GreenBroker lead — ${contractor.business_name}`,
    text: `New lead available!\n\nLog in to view: ${appUrl}/dashboard/contractor/leads/${leadId}`,
    html,
  });
}

// ─── Rebate Deadline Reminder ─────────────────────────────────────────────────

export async function sendRebateDeadlineReminder({
  email,
  firstName,
  rebateName,
  deadlineDate,
  rebateUrl,
}: {
  email: string;
  firstName?: string;
  rebateName: string;
  deadlineDate: string;
  rebateUrl: string;
}) {
  const name = firstName ?? "there";

  return sendEmail({
    to: email,
    subject: `⏰ Deadline approaching: ${rebateName}`,
    text: `Hi ${name},\n\nA rebate deadline is approaching!\n\nProgram: ${rebateName}\nDeadline: ${deadlineDate}\nApply here: ${rebateUrl}\n\n—GreenBroker`,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function textToHtml(text: string): string {
  return `<pre style="font-family: inherit; white-space: pre-wrap;">${text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</pre>`;
}
