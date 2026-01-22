import nodemailer from 'nodemailer';

// Log env availability (no secrets)
if (!process.env.EMAIL) {
  console.warn('[NODEMAILER] EMAIL is not set');
}
if (!process.env.EMAIL_PASS) {
  console.warn('[NODEMAILER] EMAIL_PASS is not set');
}

// IMPORTANT: DO NOT use `service: gmail` on Render
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // must be true for 465
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

// ❌ REMOVE transporter.verify() — causes timeout on Render

export const sendDeliveryEmail = async (
  email,
  orderId,
  expectedDeliveryDate,
  product
) => {
  console.log(`[NODEMAILER] Attempting to send delivery email to: ${email}, Order: ${orderId}`);
  
  // Validate inputs
  if (!email) {
    throw new Error('[NODEMAILER] Recipient email is required');
  }
  if (!process.env.EMAIL) {
    throw new Error('[NODEMAILER] Sender EMAIL env variable not set');
  }
  if (!process.env.EMAIL_PASS) {
    throw new Error('[NODEMAILER] EMAIL_PASS env variable not set');
  }

  const formattedDate = expectedDeliveryDate
    ? new Date(expectedDeliveryDate).toLocaleString()
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
    <div style="font-family: Arial, Helvetica, sans-serif; color:#111">
      <h2>Quickzy — Delivery Confirmed ✅</h2>
      <p>Hi,</p>
      <p>
        Your order <strong>${orderId}</strong> for
        <strong>${productTitle}</strong>${priceText}
        has an expected delivery date of
        <strong>${formattedDate}</strong>.
      </p>
      <p>Thank you for shopping with <strong>Quickzy</strong>.</p>
      <hr />
      <p style="font-size:12px;color:#666">
        This email was sent from an automated address.
      </p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Quickzy" <${process.env.EMAIL}>`, // MUST match Gmail
      to: email,
      subject: 'Quickzy — Delivery Date Confirmed',
      html,
    });
    console.log(`[NODEMAILER] ✓ Email sent successfully. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[NODEMAILER] ✗ Failed to send email:`, {
      code: error.code,
      message: error.message,
      command: error.command,
      response: error.response,
    });
    throw error;
  }
};
