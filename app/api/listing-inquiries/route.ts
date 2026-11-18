import { createClient } from "@/utils/supabase/server";
import nodemailer from "nodemailer";

type InquiryRequest = {
  listingId?: unknown;
  buyerEmail?: unknown;
  message?: unknown;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 10_000) {
    return Response.json({ error: "The message is too long." }, { status: 413 });
  }

  let payload: InquiryRequest;
  try {
    payload = (await request.json()) as InquiryRequest;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const listingId =
    typeof payload.listingId === "string" ? payload.listingId.trim() : "";
  const buyerEmail =
    typeof payload.buyerEmail === "string" ? payload.buyerEmail.trim() : "";
  const message =
    typeof payload.message === "string" ? payload.message.trim() : "";

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      listingId,
    )
  ) {
    return Response.json({ error: "Invalid listing." }, { status: 400 });
  }
  if (
    buyerEmail.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)
  ) {
    return Response.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }
  if (message.length < 2 || message.length > 2000) {
    return Response.json(
      { error: "Messages must be between 2 and 2,000 characters." },
      { status: 400 },
    );
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailAppPassword) {
    return Response.json(
      {
        error:
          "Email delivery isn’t configured. Set GMAIL_USER and GMAIL_APP_PASSWORD on the server.",
      },
      { status: 503 },
    );
  }

  try {
    const supabase = await createClient();
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, seller_name, seller_email")
      .eq("id", listingId)
      .maybeSingle();

    if (listingError) {
      console.error("Could not look up listing for inquiry:", listingError);
      return Response.json(
        { error: "Could not find this listing. Please try again." },
        { status: 500 },
      );
    }
    if (!listing) {
      return Response.json({ error: "This listing no longer exists." }, { status: 404 });
    }

    const subject = `New message about ${listing.title}`;
    const safeTitle = escapeHtml(listing.title);
    const safeBuyerEmail = escapeHtml(buyerEmail);
    const safeMessage = escapeHtml(message).replace(/\r?\n/g, "<br>");
    const replyUrl = `mailto:${encodeURIComponent(buyerEmail)}`;
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>New message about ${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f7f7f5;font-family:Arial,Helvetica,sans-serif;color:#262a24;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">A buyer sent you a message about ${safeTitle}.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f5;">
      <tr>
        <td align="center" style="padding:36px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;">
            <tr>
              <td style="padding:0 0 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="36" height="36" align="center" valign="middle" style="width:36px;height:36px;border-radius:10px;background-color:#f1f5ea;color:#587a3b;font-size:19px;font-weight:bold;">f</td>
                    <td style="padding-left:10px;color:#242820;font-size:18px;font-weight:bold;letter-spacing:-0.3px;">fairground</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 28px;background-color:#ffffff;border:1px solid #e8ebe4;border-radius:14px;">
                <p style="margin:0 0 10px;color:#587a3b;font-size:11px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;">New buyer message</p>
                <h1 style="margin:0 0 24px;color:#242820;font-size:24px;line-height:1.3;">Someone is interested in your listing</h1>
                <p style="margin:0 0 8px;color:#7a7f75;font-size:12px;font-weight:bold;letter-spacing:0.7px;text-transform:uppercase;">Listing</p>
                <p style="margin:0 0 24px;padding:14px 16px;background-color:#f7f8f5;border:1px solid #edf0e9;border-radius:9px;color:#30352d;font-size:16px;font-weight:bold;line-height:1.5;">${safeTitle}</p>
                <p style="margin:0 0 8px;color:#7a7f75;font-size:12px;font-weight:bold;letter-spacing:0.7px;text-transform:uppercase;">Their message</p>
                <div style="padding:16px;background-color:#fbfcfa;border-left:3px solid #88a16c;border-radius:0 8px 8px 0;color:#3c4138;font-size:15px;line-height:1.7;">${safeMessage}</div>
                <p style="margin:24px 0 8px;color:#7a7f75;font-size:12px;font-weight:bold;letter-spacing:0.7px;text-transform:uppercase;">Reply to</p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.5;"><a href="${escapeHtml(replyUrl)}" style="color:#486630;text-decoration:underline;">${safeBuyerEmail}</a></p>
                <a href="${escapeHtml(replyUrl)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background-color:#587a3b;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">Reply to buyer</a>
                <p style="margin:22px 0 0;color:#858a80;font-size:12px;line-height:1.5;">Replying to this email will reach the buyer directly.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 12px 0;color:#8b9086;font-size:12px;line-height:1.6;">Sent via <strong style="color:#69705f;">fairground</strong> marketplace</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
      auth: {
        user: gmailUser,
        pass: gmailAppPassword.replace(/\s/g, ""),
      },
    });
    await transporter.sendMail({
      from: { name: "fairground", address: gmailUser },
      to: listing.seller_email,
      replyTo: buyerEmail,
      subject,
      text: `NEW BUYER MESSAGE\n\nHi ${listing.seller_name},\n\n${message}\n\nLISTING\n${listing.title}\n\nREPLY TO\n${buyerEmail}\n\nReply to this email to contact the buyer.\n\nSent via fairground marketplace.`,
      html,
    });

    const { error: inquiryError } = await supabase
      .from("listing_inquiries")
      .insert({
        listing_id: listing.id,
        buyer_email: buyerEmail,
        message,
      });

    if (inquiryError) {
      console.error("Email was sent but inquiry could not be recorded:", inquiryError);
      return Response.json({ sent: true, saved: false });
    }

    return Response.json({ sent: true, saved: true });
  } catch (error) {
    console.error("Could not send listing inquiry:", error);
    return Response.json(
      { error: "Could not send your message. Please try again." },
      { status: 500 },
    );
  }
}
