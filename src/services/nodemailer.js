import nodemailer from "nodemailer";

if (!process.env.BREVO_EMAIL) {
  console.warn("[NODEMAILER] BREVO_EMAIL is not set");
}
if (!process.env.BREVO_SMTP_KEY) {
  console.warn("[NODEMAILER] BREVO_SMTP_KEY is not set");
}

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL,
    pass: process.env.BREVO_SMTP_KEY,
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

export const sendDeliveryEmail = async (
  email,
  orderId,
  expectedDeliveryDate,
  product
) => {
  const formattedDate = expectedDeliveryDate
    ? new Date(expectedDeliveryDate).toLocaleString()
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

  await transporter.sendMail({
    from: `"Quickzy" <${process.env.BREVO_EMAIL}>`,
    to: email,
    subject: "Quickzy — Delivery Date Confirmed",
    html,
  });
};
