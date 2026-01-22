import nodemailer from 'nodemailer';

// Log env availability (no secrets)
console.log('[NODEMAILER] Initializing email service...');
if (!process.env.EMAIL) {
  console.warn('[NODEMAILER] ⚠️ EMAIL is not set');
}
if (!process.env.EMAIL_PASS) {
  console.warn('[NODEMAILER] ⚠️ EMAIL_PASS is not set');
}

// IMPORTANT: Try port 587 first (more reliable on Render), fallback to 465
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: isProduction ? 587 : 465, // Port 587 (TLS) is more reliable on Render
  secure: isProduction ? false : true, // Port 587 uses STARTTLS, 465 uses SSL
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
  // Add pool for better connection handling on Render
  pool: {
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 2000,
    rateLimit: 5,
  },
});

// Add detailed logging for production
if (isProduction) {
  console.log('[NODEMAILER] 🔧 Production mode - using port 587 (TLS)');
} else {
  console.log('[NODEMAILER] 🔧 Development mode - using port 465 (SSL)');
}

// ❌ REMOVE transporter.verify() — causes timeout on Render

export const sendDeliveryEmail = async (
  email,
  orderId,
  expectedDeliveryDate,
  product
) => {
  console.log(`[NODEMAILER] Attempting to send delivery email to: ${email}, Order: ${orderId}`);
  console.log(`[NODEMAILER] Environment: ${process.env.NODE_ENV || 'unknown'}`);
  
  // Validate inputs
  if (!email) {
    console.error('[NODEMAILER] ❌ Recipient email is required');
    throw new Error('[NODEMAILER] Recipient email is required');
  }
  if (!process.env.EMAIL) {
    console.error('[NODEMAILER] ❌ Sender EMAIL env variable not set');
    throw new Error('[NODEMAILER] Sender EMAIL env variable not set');
  }
  if (!process.env.EMAIL_PASS) {
    console.error('[NODEMAILER] ❌ EMAIL_PASS env variable not set');
    throw new Error('[NODEMAILER] EMAIL_PASS env variable not set');
  }

  const formattedDate = expectedDeliveryDate
    ? new Date(expectedDeliveryDate).toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'soon';

  const productTitle = product?.title || 'your product';
  const productPrice = product?.price;

  let priceText = '';
  if (typeof productPrice === 'number') {
    try {
      priceText = ` — ${new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(productPrice)}`;
    } catch {
      priceText = ` — ₹${productPrice}`;
    }
  }

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color:#111; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Quickzy — Delivery Confirmed ✅</h2>
      <p>Hi,</p>
      <p>
        Your order <strong>#${orderId}</strong> for
        <strong>${productTitle}</strong>${priceText}
        has an expected delivery date of
        <strong style="color: #16a34a;">${formattedDate}</strong>.
      </p>
      <p>We're preparing your order for shipment!</p>
      <p>Thank you for shopping with <strong>Quickzy</strong>.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size:12px;color:#666;">
        This email was sent from an automated address. Please do not reply to this email.
      </p>
    </div>
  `;

  try {
    console.log(`[NODEMAILER] Sending email from: ${process.env.EMAIL}`);
    const info = await transporter.sendMail({
      from: `"Quickzy" <${process.env.EMAIL}>`, // MUST match Gmail
      to: email,
      subject: '✅ Quickzy — Delivery Date Confirmed',
      html,
      text: `Your order #${orderId} has an expected delivery date of ${formattedDate}. Thank you for shopping with Quickzy!`,
    });
    
    console.log(`[NODEMAILER] ✓ Email sent successfully!`);
    console.log(`[NODEMAILER] Message ID: ${info.messageId}`);
    console.log(`[NODEMAILER] Response: ${info.response}`);
    return info;
  } catch (error) {
    console.error(`[NODEMAILER] ✗ Failed to send email to ${email}`, {
      code: error.code,
      message: error.message,
      command: error.command,
      response: error.response,
      stack: error.stack,
    });
    throw error;
  }
};
