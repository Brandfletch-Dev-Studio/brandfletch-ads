import { base44 } from "npm:@base44/sdk@latest";

const app = base44.initApp();

/**
 * sendWhatsApp — Sends a WhatsApp message via Twilio
 *
 * Body params:
 *   to: "+265999123456"  (E.164 format)
 *   message: "Your campaign was submitted..."
 *
 * Env vars required:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_WHATSAPP_FROM   e.g. "whatsapp:+14155238886"
 */
app.post("/sendWhatsApp", async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: "Missing 'to' or 'message'" });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

  if (!accountSid || !authToken) {
    return res.status(500).json({ error: "Twilio credentials not configured" });
  }

  const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  const credentials = btoa(`${accountSid}:${authToken}`);
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const body = new URLSearchParams({
    From: fromNumber,
    To: toFormatted,
    Body: message,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Twilio error:", data);
      return res.status(502).json({ error: data.message || "Twilio API error", details: data });
    }

    return res.json({ success: true, sid: data.sid });
  } catch (err) {
    console.error("WhatsApp send failed:", err);
    return res.status(500).json({ error: "Failed to send WhatsApp message" });
  }
});

export default app;
