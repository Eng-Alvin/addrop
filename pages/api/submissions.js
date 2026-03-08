import fs from 'fs'
import path from 'path'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const dataFile = path.join(process.cwd(), 'data', 'submissions.json')

function ensureFile() {
  const dir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '[]')
}

export default async function handler(req, res) {
  ensureFile()

  if (req.method === 'POST') {
    try {
      const existing = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
      const newEntry = {
        id: Date.now().toString(),
        submittedAt: new Date().toISOString(),
        status: 'new',
        ...req.body,
      }
      existing.unshift(newEntry) // newest first
      fs.writeFileSync(dataFile, JSON.stringify(existing, null, 2))

      // Send the beautifully designed welcome email via Resend
      try {
        await resend.emails.send({
          from: 'AdDrop <ntahalvin02@gmail.com>', // using user's sender email
          reply_to: 'ntahalvin02@gmail.com',
          to: [req.body.email],
          subject: '🎉 Welcome to AdDrop™, your first drop is coming',
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #0E0E0B; color: #F0F0EA; padding: 40px; text-align: center;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #161612; border: 1px solid #252520; border-radius: 16px; padding: 40px; text-align: left; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
                <h1 style="margin-bottom: 24px; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; text-align: center;">Ad<span style="color: #FF4D1C;">Drop</span>™</h1>
                
                <p style="font-size: 16px; color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 24px;">
                  Hey \${req.body.fullName?.split(' ')[0] || 'Partner'},
                </p>

                <p style="font-size: 16px; color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 24px;">
                  You're in! Welcome to <strong>AdDrop™</strong>.
                </p>

                <p style="font-size: 16px; color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 16px;">
                  Here's what happens next:
                </p>
                
                <ul style="font-size: 16px; color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 24px; padding-left: 0; list-style-type: none;">
                  <li style="margin-bottom: 12px;">→ Follow the link below to set up a call with me</li>
                  <li style="margin-bottom: 12px;">→ After the call your first drop of 5 ads will drop in the specified date we will set during the call.</li>
                </ul>

                <div style="background-color: #0A0A07; border: 1px solid #252520; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
                  <p style="margin: 0; font-size: 16px; color: #F0F0EA;">
                    <strong>Note:</strong> Every Monday after that, fresh ads land in your inbox.
                  </p>
                </div>

                <div style="text-align: center; margin-bottom: 32px;">
                  <a href="https://whop.com/joined/addrop-613e/exp_mLw3u0enZ280JW/app/" style="display: inline-block; background-color: #FF4D1C; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 16px; font-weight: bold; border-radius: 8px;">Set Up Your Call</a>
                </div>

                <p style="font-size: 16px; color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 32px;">
                  Questions? Just reply to this email. I personally read every one.
                </p>

                <p style="font-size: 16px; color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 0;">
                  <strong>AdDrop™</strong>
                </p>

                <hr style="border: none; border-top: 1px solid #252520; margin: 40px 0;">
                <p style="font-size: 12px; color: rgba(255,255,255,0.4); text-align: center;">© 2026 AdDrop™. All rights reserved.</p>
              </div>
            </div>
          `
        })
      } catch (emailErr) {
        console.error('Failed to send Welcome Email:', emailErr)
      }

      res.status(200).json({ success: true, id: newEntry.id })
    } catch (e) {
      res.status(500).json({ error: 'Failed to save submission' })
    }

  } else if (req.method === 'GET') {
    // Protected — require admin token
    const token = req.headers['x-admin-token']
    if (token !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    try {
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
      res.status(200).json(data)
    } catch {
      res.status(200).json([])
    }

  } else if (req.method === 'PATCH') {
    // Update status
    const token = req.headers['x-admin-token']
    if (token !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    try {
      const { id, status } = req.body
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
      const idx = data.findIndex(s => s.id === id)
      if (idx !== -1) data[idx].status = status
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2))
      res.status(200).json({ success: true })
    } catch {
      res.status(500).json({ error: 'Failed to update' })
    }

  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
