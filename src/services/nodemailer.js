import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

export const sendDeliveryEmail = async (email, orderId, expectedDeliveryDate, product) => {
  const formattedDate = expectedDeliveryDate ? new Date(expectedDeliveryDate).toLocaleString() : 'soon';
  const productTitle = product?.title || 'your product';
  const productPrice = typeof product?.price !== 'undefined' ? product.price : null;
  let priceText = '';
  try {
    if (productPrice !== null) {
      priceText = ` — ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(productPrice)}`;
    }
  } catch (e) {
    priceText = productPrice !== null ? ` — ₹${productPrice}` : '';
  }

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #111">
      <h2>Quickzy — Delivery Confirmed ✅</h2>
      <p>Hi,</p>
      <p>Your order <strong>${orderId}</strong> for <strong>${productTitle}</strong>${priceText} now has an expected delivery date of <strong>${formattedDate}</strong>.</p>
      <p>Thank you for shopping with <strong>Quickzy</strong> — we’ll notify you if anything changes.</p>
      <hr />
      <p style="font-size:12px;color:#666">If you have questions, reply to this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: 'Quickzy <no-reply@quickzy.com>',
    to: email,
    subject: 'Quickzy — Delivery Date Confirmed',
    html,
  });
};
