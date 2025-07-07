import { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from 'nodemailer'

/* ─────────────────────────  Helpers  ───────────────────────── */
const CORS = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age'      : '86400'
}

/* ─────────────────────────  Mailer  ────────────────────────── */
console.log('🔧 Building SMTP transport...')
const transporter = nodemailer.createTransport({
  host   : process.env.MAIL_HOST,
  port   : Number(process.env.MAIL_PORT) || 465,
  secure : true,
  auth   : { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
})
console.log('✅ Transport ready; will send from', process.env.MAIL_FROM)

/* ─────────────────────────  Handler  ───────────────────────── */
export default async function handler (req: VercelRequest, res: VercelResponse) {
  /* CORS pre-flight */
  if (req.method === 'OPTIONS') {
    console.log('🟡 CORS pre-flight received')
    res.writeHead(200, CORS).end()
    return
  }

  /* Block any non-POST after pre-flight */
  if (req.method !== 'POST') {
    console.warn('⛔  Method not allowed:', req.method)
    res.writeHead(405, { ...CORS, 'Content-Type': 'application/json' })
       .end(JSON.stringify({ error: 'Method Not Allowed' }))
    return
  }

  console.log('📨 Incoming POST at', new Date().toISOString())

  /* Parse JSON body */
  const vars = req.body
  console.log('📦 Payload:', vars)

  if (!vars?.email || !vars?.name) {
    console.warn('❌ Missing required fields')
    res.writeHead(400, { ...CORS, 'Content-Type': 'application/json' })
       .end(JSON.stringify({ error: 'Missing required fields' }))
    return
  }

  const text = buildTemplate(vars)
  const html = `<pre style="font-family: monospace; white-space: pre-wrap;">${text}</pre>`

  try {
    console.log('🚀 Sending e-mail to', process.env.MAIL_TO || process.env.MAIL_FROM)
    const info = await transporter.sendMail({
      from   : process.env.MAIL_FROM,
      to     : process.env.MAIL_TO || process.env.MAIL_FROM,
      subject: `🔥 New Custom Protocol Request from ${vars.name}`,
      text, html
    })
    console.log('✅ Mail sent; messageId:', info.messageId)

    res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' })
       .end(JSON.stringify({ ok: true }))
  } catch (err) {
    console.error('❌ Mail send failed:', err)
    res.writeHead(500, { ...CORS, 'Content-Type': 'application/json' })
       .end(JSON.stringify({ error: 'Failed to send email' }))
  }
}

/* ────────────────────────  Template  ───────────────────────── */
function buildTemplate (v: any): string {
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
${v.complete_form_data}`
}
