require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

async function sendBookingConfirmation(booking) {
  if (!process.env.EMAIL_USER) return; // skip if not configured

  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
      <div style="background: #0069ff; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">You're Scheduled!</h1>
      </div>
      <div style="background: #f9fafb; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #374151; font-size: 15px;">Hi <strong>${booking.invitee_name}</strong>,</p>
        <p style="color: #6b7280; font-size: 14px;">Your meeting has been confirmed. Here are the details:</p>

        <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 13px; width: 80px;">Event</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${booking.event_name}</td></tr>
            <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Date</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px;">${formatDate(booking.start_time)}</td></tr>
            <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Duration</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px;">${booking.duration_minutes} minutes</td></tr>
            <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">With</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px;">Alex Johnson</td></tr>
          </table>
        </div>

        <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 20px;">
          Need to reschedule? Visit your booking confirmation link.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      booking.invitee_email,
    subject: `Confirmed: ${booking.event_name} with Alex Johnson`,
    html,
  });
}

async function sendCancellationEmail(booking) {
  if (!process.env.EMAIL_USER) return;

  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
      <div style="background: #ef4444; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Meeting Cancelled</h1>
      </div>
      <div style="background: #f9fafb; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #374151; font-size: 15px;">Hi <strong>${booking.invitee_name}</strong>,</p>
        <p style="color: #6b7280; font-size: 14px;">
          Your <strong>${booking.event_name}</strong> scheduled for
          <strong>${formatDate(booking.start_time)}</strong> has been cancelled.
        </p>
        <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
          You can book a new time at any time.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      booking.invitee_email,
    subject: `Cancelled: ${booking.event_name} with Alex Johnson`,
    html,
  });
}

module.exports = { sendBookingConfirmation, sendCancellationEmail };