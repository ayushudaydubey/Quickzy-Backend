import nodemailer from "nodemailer";

// Validate Brevo credentials
console.log("[NODEMAILER] Initializing Brevo Email Service...");
if (!process.env.BREVO_EMAIL) {
  console.error("[NODEMAILER] ❌ BREVO_EMAIL is not set in .env");
}
if (!process.env.BREVO_SMTP_KEY) {
  console.error("[NODEMAILER] ❌ BREVO_SMTP_KEY is not set in .env");
}
if (!process.env.EMAIL) {
  console.warn("[NODEMAILER] ⚠️ EMAIL is not set - will use BREVO_EMAIL as sender");
}

// Brevo SMTP Configuration
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // TLS (port 587)
auth: {
  user: process.env.BREVO_LOGIN,   // a0a57c001@smtp-brevo.com
  pass: process.env.BREVO_SMTP_KEY,
},
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
  logger: process.env.NODE_ENV === "production" ? false : true,
});

export const sendDeliveryEmail = async (
  email,
  orderId,
  expectedDeliveryDate,
  product
) => {
  console.log(`[NODEMAILER] 📧 Sending delivery email...`);
  console.log(`  To: ${email}`);
  console.log(`  Order ID: ${orderId}`);
  
  // Validate required fields
  if (!email) {
    console.error("[NODEMAILER] ❌ Recipient email is required");
    throw new Error("[NODEMAILER] Recipient email is required");
  }
  
  if (!process.env.BREVO_EMAIL) {
    console.error("[NODEMAILER] ❌ BREVO_EMAIL env variable is not set");
    throw new Error("[NODEMAILER] BREVO_EMAIL not configured");
  }
  
  if (!process.env.BREVO_SMTP_KEY) {
    console.error("[NODEMAILER] ❌ BREVO_SMTP_KEY env variable is not set");
    throw new Error("[NODEMAILER] BREVO_SMTP_KEY not configured");
  }

  const formattedDate = expectedDeliveryDate
    ? new Date(expectedDeliveryDate).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "soon";

  const productTitle = product?.title || "your product";
  const productPrice = product?.price;

  let priceText = "";
  if (typeof productPrice === "number") {
    try {
      priceText = ` — ${new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(productPrice)}`;
    } catch {
      priceText = ` — ₹${productPrice}`;
    }
  }

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color:#111; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
        Quickzy — Delivery Confirmed ✅
      </h2>
      <p style="font-size: 16px;">Hi,</p>
      <p style="font-size: 15px; line-height: 1.6;">
        Your order <strong>#${orderId}</strong> for<br/>
        <strong style="color: #1f2937;">${productTitle}</strong>${priceText}<br/>
        has an expected delivery date of<br/>
        <strong style="color: #16a34a; font-size: 18px;">${formattedDate}</strong>
      </p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          📦 We're preparing your order for shipment. You'll receive updates soon!
        </p>
      </div>
      <p style="font-size: 15px;">
        Thank you for shopping with <strong>Quickzy</strong>. We appreciate your business!
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">
        This email was sent from an automated address. Please do not reply to this email.
      </p>
    </div>
  `;

  try {
    console.log(`[NODEMAILER] Connecting to Brevo SMTP...`);
    const info = await transporter.sendMail({
      from: `"Quickzy" <${process.env.BREVO_EMAIL}>`, // Must match Brevo verified sender
      to: email,
      subject: "✅ Quickzy — Delivery Date Confirmed",
      html,
      text: `Your order #${orderId} has an expected delivery date of ${formattedDate}. Thank you for shopping with Quickzy!`,
    });

    console.log(`[NODEMAILER] ✅ Email sent successfully!`);
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`  Response: ${info.response}`);
    return info;
  } catch (error) {
    console.error(`[NODEMAILER] ❌ Failed to send email to ${email}`);
    console.error(`  Error Code: ${error.code}`);
    console.error(`  Error Message: ${error.message}`);
    console.error(`  Command: ${error.command}`);
    console.error(`  Response: ${error.response}`);
    
    if (process.env.NODE_ENV === "production") {
      console.error(`[NODEMAILER] Full Error Details:`, error);
    }
    
    throw error;
  }
};
