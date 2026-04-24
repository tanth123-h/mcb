# MCB System — Deployment Guide
## Vercel + Supabase (Production Setup)

---

## Prerequisites

- Node.js 18+
- Git repo (GitHub / GitLab / Bitbucket)
- Free accounts: [supabase.com](https://supabase.com) + [vercel.com](https://vercel.com)

---

## Step 1 — Supabase Project Setup

### 1.1 Create Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose a name: `mcb-system`
4. Pick a strong database password (save it!)
5. Choose nearest region
6. Wait ~2 minutes for provisioning

### 1.2 Run Schema

1. In your project → **SQL Editor** → **New query**
2. Paste the full contents of `schema.sql`
3. Click **Run** (▶)
4. Verify in **Table Editor**: you should see `applications`, `personnel`, `squads`

### 1.3 Get API Keys

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 1.4 Configure Row Level Security (Optional — Recommended for production)

Since this app uses no real auth, the simplest approach is:

```sql
-- Allow public read/write on all tables (roleplay-appropriate)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel    ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads       ENABLE ROW LEVEL SECURITY;

-- Allow anon to do everything
CREATE POLICY "anon all" ON applications FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon all" ON personnel    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon all" ON squads       FOR ALL TO anon USING (true) WITH CHECK (true);
```

### 1.5 Set Up Avatar Storage Bucket

1. Go to **Storage** → **New bucket**
2. Name: `avatars`
3. Toggle **Public bucket**: ON
4. Click **Create bucket**
5. Go to **Policies** on the `avatars` bucket
6. Add policy: **Full access for anon** (or use this SQL):

```sql
CREATE POLICY "avatars public read"   ON storage.objects FOR SELECT TO anon USING (bucket_id = 'avatars');
CREATE POLICY "avatars anon upload"   ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "avatars anon update"   ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'avatars');
CREATE POLICY "avatars anon delete"   ON storage.objects FOR DELETE TO anon USING (bucket_id = 'avatars');
```

### 1.5b Set Up Task Report Storage Bucket

1. Go to **Storage** → **New bucket**
2. Name: `task-reports`
3. Toggle **Public bucket**: ON
4. Reuse the same public read / anon upload-update-delete policies as `avatars`, but replace the bucket id with `task-reports`

This bucket is used for optional report screenshots on `/tasks/[id]/submit`.

### 1.6 Enable Realtime

1. Go to **Database** → **Replication**
2. Under **Source**, enable the `personnel` table
3. This enables live status-change broadcasts

---

## Step 2 — Local Setup

```bash
# Clone your repo
git clone https://github.com/yourname/mcb-system.git
cd mcb-system

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```bash
# Start dev server
npm run dev
# → http://localhost:3000
```

---

## Step 3 — Deploy to Vercel

### 3.1 Push to Git

```bash
git add .
git commit -m "feat: MCB system initial deployment"
git push origin main
```

### 3.2 Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your `mcb-system` repo
4. Framework: **Next.js** (auto-detected)

### 3.3 Set Environment Variables

In the Vercel import screen → **Environment Variables**:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

> ⚠️ These must be set BEFORE the first deploy — they're embedded at build time.

### 3.4 Deploy

Click **Deploy** — Vercel builds and deploys automatically (~1–2 minutes).

You'll get a URL like: `https://mcb-system-yourname.vercel.app`

---

## Step 4 — Custom Domain (Optional)

1. Vercel Dashboard → your project → **Settings** → **Domains**
2. Add your domain (e.g. `mcb-internal.yourdomain.com`)
3. Add the DNS records Vercel provides (usually a CNAME)
4. TLS is automatic

---

## Step 5 — Post-Deploy Checklist

```
□ Visit / → landing page boots correctly
□ Visit /apply → submit a test application
□ Visit /admin-secret → see application in pending
□ Accept application → check MCB-0001 created in personnel
□ Visit /access → log in with new codename + MCB-0001
□ Profile page loads with decryption animation
□ Upload avatar on profile (requires Storage bucket)
□ Visit /tasks → assigned directives are visible for logged-in personnel
□ Submit a task report with optional image proof
□ Visit /admin/tasks → create task, review submission, accept/reject
□ Open two browser windows → change status in admin
  → second window should show realtime toast notification
□ Sound toggle works (top bar AUDIO:ON/OFF)
```

---

## Updating

```bash
# Make changes locally, then:
git add .
git commit -m "feat: your change"
git push origin main
# Vercel auto-deploys on push to main
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase public anon key |

Both are prefixed `NEXT_PUBLIC_` because they're used client-side.
Since there's no auth and they're anon-level keys, this is safe.

---

## Troubleshooting

**"Error: Supabase credentials not configured"**
→ Check `.env.local` exists and has correct values. Restart dev server.

**Applications table: permission denied**
→ Run the RLS policy SQL from Step 1.4 in the SQL editor.

**Avatar upload fails with 400**
→ Bucket doesn't exist or isn't public. Redo Step 1.5.

**Realtime toast not appearing**
→ Check Step 1.6 — `personnel` table must have replication enabled.

**MCB ID generation fails**
→ Ensure `next_mcb_id` function and `mcb_id_seq` sequence were created.
   Re-run the relevant parts of `schema.sql`.

---

## Architecture Notes

- **No server-side secrets** — all Supabase calls use the anon key from the client
- **No auth** — security is UX-simulated; the admin route is protected by obscurity
- **Session** — stored in `localStorage` under `mcb_session`
- **Realtime** — Supabase Postgres CDC over WebSocket; no extra infra needed
- **Sound** — fully synthesized via Web Audio API; zero network requests
- **Avatars** — stored in Supabase Storage; served via CDN
