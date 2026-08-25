export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Cricket Connect <noreply@petee.in>",
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    console.error("Email send failed:", await res.text());
  }
}
