# Deploying Nidaa: Supabase + Railway

- **Supabase** holds the data (Postgres) and the logins (Supabase Auth).
- **Railway** runs the app.

Allow about 30 minutes. Do the steps in order: later steps need values from earlier ones.

## How it fits together

- **Data:** Nidaa loads all its data from Supabase into memory when it starts, then saves each change
  back to Supabase before it confirms the change. Railway can restart or redeploy at any time and
  nothing is lost.
- **One server only:** because the data is held in memory, run **one** copy of the app. `railway.json`
  sets `numReplicas: 1`; **never scale it up**.
- **Photos and videos:** these are stored in Supabase too, so Railway needs no disk.
- **Who can sign in:** only people you add in Supabase. Public sign-up is switched off (step A4).

---

## A. Supabase

### A1. Create the project
1. Go to https://supabase.com/dashboard and click **New project**.
2. **Name:** `nidaa`.
3. **Database password:** click **Generate a password**, then **save it in your password manager**.
   You need it in A2, and Supabase won't show it again.
4. **Region:** the one closest to your guests and to the Railway region you'll pick in B3. For guests in
   India or the Gulf, **Southeast Asia (Singapore)** is a good choice for both.
5. Click **Create new project** and wait a minute or two.

### A2. Copy the database connection string → `DATABASE_URL`
1. Click **Connect** in the top bar of the project.
2. Under **Connection string**, set **Method** to **Session pooler**. Don't use "Direct connection":
   it's IPv6-only and Railway may not reach it.
3. Copy the URI. It looks like:
   `postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`
4. Replace `[YOUR-PASSWORD]` with the password from A1, removing the square brackets.
   - If the password has `@`, `#`, `/`, `?` or `%`, URL-encode those characters (for example, `@` becomes `%40`).
   - Or generate a password without those characters.

Nidaa creates its two tables (`nidaa_docs`, `nidaa_media_files`) itself on first start. Row-level
security is on with no policies, so the public Supabase API can't read guest data. Only the server's
own database connection can.

### A3. Copy the URL and key → `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
1. **Project Settings → Data API:** copy **Project URL** (`https://abcdefgh.supabase.co`). This is `SUPABASE_URL`.
2. **Project Settings → API Keys:** copy the **Publishable key** (`sb_publishable_…`). This is `SUPABASE_PUBLISHABLE_KEY`.
   - If you only see the older **anon** key, that works too: use it as `SUPABASE_PUBLISHABLE_KEY`.
   - **Never use the `service_role` / secret key.** Nidaa doesn't need it.

### A4. Lock down sign-up
1. Go to **Authentication → Sign In / Providers**.
2. Turn **off** "Allow new users to sign up". Otherwise anyone who finds the login page could create an
   account and see your guest lists.
3. Leave **Email** enabled.

### A5. Create your login
1. Go to **Authentication → Users → Add user → Create new user**.
2. Enter your email and a strong password, and tick **Auto Confirm User**.
3. Do the same for anyone else who should manage events. Remove someone by deleting them here; they're
   signed out within the hour, when their session expires.
4. Everyone can change their own password later in Nidaa under **Settings → Your sign-in**.

---

## B. Railway

### B1. Put the code on GitHub
Railway deploys from the `Trustafa/nidaa` repository, so the latest code must be pushed there. The
`dashboard-ui` branch is fine, or merge it into `main` first.

### B2. Create the service
1. Go to https://railway.com, sign in with GitHub, then click **New Project → Deploy from GitHub repo**.
2. Pick **Trustafa/nidaa**.
   - If it isn't listed, click **Configure GitHub App** and give Railway access to the repo.
   - The repo owner (Trustafa) may need to approve this.
3. In the service, go to **Settings → Source → Branch** and pick the branch from B1.

Railway reads `railway.json` from the repo:
- **Build:** `npm run build`.
- **Start:** `npm start`.
- **Health check:** `/api/health`.
- **Replicas:** one.
- **Redeploys:** no overlap between the old and new server.

The first deploy fails until you add the variables in B4. That's expected.

**No GitHub access?** Install the Railway CLI (`npm i -g @railway/cli`), run `railway login`, then from
the project folder run `railway link` followed by `railway up`.

### B3. Region
In **Settings → Deploy → Regions**, pick the same area as your Supabase project, e.g. **Southeast Asia**.

### B4. Variables
Go to **Variables → Raw Editor** and paste the block below with your values filled in.

**Copy these from your `.env.local`:**
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_APP_ID`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

**Don't copy `DATABASE_URL`:** your local one points at your own computer. Use the Supabase one from A2.

```bash
DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."

WHATSAPP_BUSINESS_ACCOUNT_ID="755886984219204"
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_ACCESS_TOKEN=""
WHATSAPP_APP_ID=""
WHATSAPP_APP_SECRET=""
WHATSAPP_WEBHOOK_VERIFY_TOKEN=""
WHATSAPP_API_VERSION="v25.0"
WHATSAPP_TEMPLATE_LANGUAGE="en"
WHATSAPP_DAILY_LIMIT="250"

NIDAA_LEGAL_NAME="Your business name"
NIDAA_PRIVACY_EMAIL="privacy@yourdomain.com"
NEXT_PUBLIC_APP_URL="https://set-this-in-B5.up.railway.app"
```

Click **Update Variables**.

### B5. Public address
1. Go to **Settings → Networking → Generate Domain**. Railway gives you something like
   `https://nidaa-production-1a2b.up.railway.app`. If it asks for a port, leave the one it suggests:
   Nidaa listens on Railway's `PORT`.
2. Put that address in the `NEXT_PUBLIC_APP_URL` variable. Railway redeploys automatically.
3. **Optional, custom domain** (e.g. `rsvp.yourdomain.com`):
   - Under **Networking → Custom Domain**, add it.
   - Create the CNAME record Railway shows, at your domain registrar.
   - Then use that address in `NEXT_PUBLIC_APP_URL` and in part C.

`NIDAA_*` and `NEXT_PUBLIC_*` values are built into the app, so changing them needs a redeploy.
Railway redeploys automatically when you save variables.

### B6. Check it's running
1. Open **Deployments → View logs**. You should see `[db] loaded 0 events, 0 guests`.
2. Open `https://<your-address>/api/health`. It should show `{"ok":true,"database":"ok"}`.
3. Open `https://<your-address>` and sign in with the login from A5.
4. Go to **Settings** and fill in **About you**.

---

## C. Point WhatsApp at the live app

1. **Webhook:**
   1. Go to https://developers.facebook.com/apps, open your app, then **WhatsApp → Configuration → Webhook → Edit**.
   2. **Callback URL:** `https://<your-address>/api/whatsapp/webhook`.
   3. **Verify token:** the exact value of `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
   4. Click **Verify and save**, then **Manage** and subscribe to **messages**.
2. **Subscribe the app to your WhatsApp account:** in Nidaa, go to **Settings → Subscribe app**.
3. **Privacy policy:**
   1. In the Meta app, go to **App settings → Basic**.
   2. **Privacy Policy URL:** `https://<your-address>/privacy`.
   3. **User data deletion → Data deletion instructions URL:** `https://<your-address>/privacy#delete`.
   4. Click **Save**.
4. **Live mode:** switch the Meta app to **Live** (toggle at the top of the app dashboard).
5. **Test with yourself:**
   1. In Nidaa, go to **Settings → Send test message** and send one to your own WhatsApp.
   2. Create a test event with yourself as the only guest and send the invitation.
   3. Tap **Attending** and pick a number.
   4. Check the reply shows on the dashboard.

---

## Day to day

- **Deploying changes:** push to the branch Railway watches; it builds and swaps over automatically.
  For a few seconds the old server finishes what it was doing. The new one re-reads anything the old
  one saved in that window.
- **Scaling:** keep **one replica**. If you ever need more, the data layer has to move to direct
  database reads first.
- **Backups:**
  - Supabase's free plan has no point-in-time recovery, and free projects can be **paused after a
    week of inactivity**.
  - For real events, use Supabase **Pro**, which has daily backups and no pausing.
  - Alternatively, export data before big events: **Database → Backups**, or `pg_dump`.
- **Costs:**
  - Railway's Hobby plan is about $5 a month, which covers a small app like this.
  - Supabase is free, or $25 a month on Pro.
  - Meta charges per delivered Marketing template (invitations and reminders).
- **Logs:**
  - In Railway, go to **Deployments → View logs**. Lines starting with `[whatsapp]`, `[db]` and
    `[scheduler]` are Nidaa's.
  - Sign-in attempts are in Supabase under **Authentication → Logs**.
