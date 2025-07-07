import { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

// Build an SMTP transport from env vars set in the Vercel dashboard
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const vars = req.body;

  // Very light validation – expand as needed
  if (!vars?.email || !vars?.name) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // Substitute the template placeholders with incoming data
  const text = buildTemplate(vars);
  const html = `<pre style="font-family: monospace; white-space: pre-wrap;">${text}</pre>`;

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM,           // e.g. "Protocol Bot <noreply@example.com>"
      to: process.env.MAIL_TO || process.env.MAIL_FROM,
      subject: `🔥 New Custom Protocol Request from ${vars.name}`,
      text,
      html,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send email' });
  }
}

function buildTemplate(v: any): string {
  return `A message by ${v.name} has been received. Kindly respond at your earliest convenience.
👤
${v.name}
${v.time || new Date().toLocaleString()}
${v.message}

🔥 NEW CUSTOM PROTOCOL REQUEST

Customer Information:
- Name/Handle: ${v.name_handle}
- Email: ${v.email}
- Gender: ${v.gender}
- Age/Height/Weight: ${v.age_height_weight}
- Body Fat: ${v.body_fat}

Goals & Pain Points:
- Top Goals: ${v.goals}
- Biggest Pain: ${v.biggest_pain}
- Energy Level: ${v.energy_level}/10

Health Issues:
- Digestion Issues: ${v.digestion_issues}
- Hormone Symptoms: ${v.hormone_symptoms}

Nutrition & Lifestyle:
- Daily Food: ${v.daily_food}
- Food Restrictions: ${v.food_restrictions}
- Current Supplements: ${v.supplements}
- Training Days: ${v.training_days}
- Sleep: ${v.sleep}
- Stress Level: ${v.stress_level}/10

Additional Info:
- Skin Issues: ${v.skin_issues}
- Result Timeline: ${v.result_timeline}
- Supplement Budget: ${v.supplement_budget}
- Additional Notes: ${v.additional_info}

Submission Details:
- Product: ${v.product_name}
- Date: ${v.submission_date}

Complete Form Data:
${v.complete_form_data}`;
}
