# AdDrop™ — Onboarding + Admin Dashboard

A Next.js app with:
- `/` — Client onboarding form (public)
- `/admin` — Password-protected admin dashboard

---

## 🚀 Deploy to Vercel (5 minutes)

### Step 1 — Push to GitHub
```bash
# Initialize git in this folder
git init
git add .
git commit -m "Initial AdDrop setup"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOURUSERNAME/addrop.git
git push -u origin main
```

### Step 2 — Deploy on Vercel
1. Go to **vercel.com** → "Add New Project"
2. Import your GitHub repo
3. Vercel auto-detects Next.js — click **Deploy**

### Step 3 — Set your admin password
1. In Vercel → your project → **Settings → Environment Variables**
2. Add: `ADMIN_PASSWORD` = `your_secret_password` (make it strong!)
3. Click **Save**, then go to **Deployments → Redeploy**

### Step 4 — Your URLs
- Onboarding form: `https://addrop.vercel.app/`
- Admin dashboard: `https://addrop.vercel.app/admin`

---

## 💻 Run Locally

```bash
# Install dependencies
npm install

# Create your local env file
cp .env.example .env.local
# Edit .env.local and set ADMIN_PASSWORD=yourpassword

# Run dev server
npm run dev
```

Open http://localhost:3000 for the form  
Open http://localhost:3000/admin for the dashboard

---

## ⚠️ Important Note on Data Storage

This app stores submissions in `data/submissions.json` on the server filesystem.

**On Vercel**: The filesystem is ephemeral — data resets on each deployment. For permanent storage, upgrade to one of these:

### Free options:
- **Vercel KV** (Redis) — free tier, plug-and-play with Next.js
- **PlanetScale** — free MySQL database
- **Supabase** — free PostgreSQL + auto-generated API

To upgrade, replace the file read/write in `pages/api/submissions.js` with your database calls. The API structure stays the same.

---

## 📁 File Structure

```
addrop/
├── pages/
│   ├── index.js          # Onboarding form
│   ├── admin.js          # Admin dashboard
│   ├── _app.js           # App wrapper
│   └── api/
│       └── submissions.js # API: save + retrieve + update
├── styles/
│   └── globals.css
├── .env.example
├── vercel.json
└── package.json
```
