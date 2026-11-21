# Connecting Nidaa to the WhatsApp Business Platform (Cloud API)

Everything you need to take Nidaa from simulation mode to sending real WhatsApp messages.

Platform facts here were checked against Meta's developer docs on **5 Oct 2026**. Items marked
**(verify)** couldn't be confirmed on a Meta page and should be checked before you rely on them.

---

## 0. How Nidaa uses WhatsApp

```
Organizer clicks "Send invitations"
  → POST /{phone-number-id}/messages   (template: nidaa_invitation, 3 quick-reply buttons,
                                         each with payload  rsvp:<guestId>:<choice>)
   (with the event's photo/video as the header when one is attached:
    nidaa_invitation_image / nidaa_invitation_video)
Guest taps "Attending"
  → Meta POSTs /api/whatsapp/webhook   (type "button", button.payload = rsvp:g42:attending)
  → Nidaa marks the guest attending and asks "How many people…?" with a tap-to-choose
    picker: reply buttons for up to 3, a list message for up to 10
    (free-form is allowed because the guest's tap opened a 24-hour customer service window)
Guest taps "3 people" (or types 3)
  → webhook (interactive.list_reply.id = party:g42:3) → party size saved → "Confirmed for 3"
Meanwhile Meta sends status webhooks (sent → delivered → read, or failed + error code)
  → shown on each message in the guest drawer
Hourly cron → /api/cron/reminders → chaser template to guests who haven't replied,
  and nidaa_event_reminder to attending guests N days before the event
```

| Concern | Where it lives |
|---|---|
| Env/config, simulation mode | `src/lib/whatsapp/config.ts` |
| Graph API calls (send, templates, subscribed apps) | `src/lib/whatsapp/client.ts` |
| Template definitions + send/creation payloads | `src/lib/whatsapp/templates.ts` |
| Webhook signature check + payload parsing | `src/lib/whatsapp/webhook.ts` |
| Webhook endpoint (GET verify, POST events) | `src/app/api/whatsapp/webhook/route.ts` |
| RSVP conversation logic, error hints, reminders | `src/lib/rsvp.ts` |
| Reminder cron endpoint | `src/app/api/cron/reminders/route.ts` |
| Connection status, template status, test send | **Settings** page (`/settings`) |

Until `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` are set, Nidaa runs in **simulation
mode**. Sends are recorded in each guest's timeline but nothing leaves the server. The guest drawer
gets a "Simulate a reply" panel, which sends the reply through the same handler the real webhook uses.

---

## 1. Decide your account model first

Nidaa is multi-tenant, so you have two options:

| | **A. One Nidaa-owned number** (recommended for MVP) | **B. Each organizer connects their own number** |
|---|---|---|
| Sender guests see | "Nidaa" (your verified display name) | The organizer's business name |
| Meta setup | One WhatsApp Business Account (WABA) and one System User token | Become a **Tech Provider**, then add Embedded Signup to Nidaa |
| Requirements | Business verification for your company | Business verification, plus App Review for advanced `whatsapp_business_messaging` and `whatsapp_business_management` (screencasts of sending a message and creating a template) |
| Who pays Meta | You, then you bill organizers | Each organizer adds a payment method to their own WABA |
| Messaging limit | One shared limit for all organizers (limits are per business portfolio) | Each organizer has their own |
| Onboarding caps | — | 10 new customers per rolling 7 days, rising to 200 after verification |

**Start with A.** The code is written for it (one set of env vars). If you move to B later:
- Store credentials per organization.
- Add the Embedded Signup flow. Use **v4**, because v2 is deprecated on 15 Oct 2026.
- After signup, exchange the returned code for a business token.
- Register the number with `POST /{phone-number-id}/register` and a PIN.
- Subscribe the app with `POST /{waba-id}/subscribed_apps`.
- Route webhooks to a tenant by `metadata.phone_number_id`. `parseWebhook()` already reads it.

"Coexistence" lets an organizer keep using the WhatsApp Business app on the same number. It's capped
at 20 messages per second and has some feature limits. It only matters under option B.

---

## 2. Accounts and verification

1. **Meta Business portfolio** at business.facebook.com, set up for your legal entity.
2. **Business verification**: Business Settings → Security Center. Verification:
   - raises the messaging limit from 250 to 2,000 unique users per 24h;
   - lets you register up to 20 numbers instead of 2;
   - is required for option B.
   Expect it to take days. Your legal name, address and website must match your documents.
3. **Meta developer app** at developers.facebook.com: create an app of type **Business**, link it to
   the portfolio, and add the **WhatsApp** product. This creates a WABA and a **test number**.
4. **App Secret**: App settings → Basic → App secret. Copy it to `WHATSAPP_APP_SECRET`.
5. Switch the app to **Live** mode before production. Webhooks for real traffic require it.

## 3. Phone number

- **For development, use the test number.** It can message up to **5 verified recipient numbers**
  **(verify)**. You add those under WhatsApp → API Setup. Messages to anyone else fail with error 131030.
- **For production, add your own number** under WhatsApp → API Setup → Add phone number.
  - It must be able to receive an SMS or voice code.
  - It must **not** be in use on the WhatsApp or WhatsApp Business app, unless you use Coexistence.
- **Display name:**
  - It must follow Meta's display-name rules and is reviewed.
  - You can change it up to 10 times per 30 days.
  - After approval, re-register the number within 14 days.
- **IDs:** copy the **Phone number ID** to `WHATSAPP_PHONE_NUMBER_ID` and the **WhatsApp Business
  Account ID** to `WHATSAPP_BUSINESS_ACCOUNT_ID`. Both are on the API Setup page.

## 4. Permanent access token

The token on the API Setup page expires after 24 hours. Use a System User token for anything beyond
a quick test.

1. Business Settings → Users → **System users** → Add. Choose an Admin role.
2. **Assign assets:** give the system user your app (full control) and your WABA (manage).
3. **Generate token** for the app with these permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
   - `business_management`

   Choose "never expire" if offered, or put token rotation on your calendar **(verify)** the options
   shown.
4. Put the token in `WHATSAPP_ACCESS_TOKEN`. Treat it like a password: store it only in your host's
   secret store, never in git.

## 5. Environment variables

```bash
WHATSAPP_PHONE_NUMBER_ID=""        # API Setup → Phone number ID
WHATSAPP_BUSINESS_ACCOUNT_ID=""    # API Setup → WhatsApp Business Account ID
WHATSAPP_ACCESS_TOKEN=""           # System User token (step 4)
WHATSAPP_APP_SECRET=""             # App settings → Basic → App secret
WHATSAPP_WEBHOOK_VERIFY_TOKEN=""   # any long random string you choose
WHATSAPP_API_VERSION="v25.0"       # see "API versions" below
WHATSAPP_TEMPLATE_LANGUAGE="en"    # language code templates are created and sent in
WHATSAPP_APP_ID=""                 # only to submit the photo/video invitation templates
NEXT_PUBLIC_APP_URL="https://your-domain"   # used to show the webhook URL in Settings
CRON_SECRET=""                     # protects /api/cron/reminders
```

Generate the verify token and cron secret with `openssl rand -hex 32`. Restart the server after
changing any of them. **Settings → WhatsApp connection** then shows which ones are set; it never
shows the values.

**API versions:**
- **v26.0** is the latest (29 Jul 2026).
- **v25.0** is supported until 29 Jul 2028.
- **v21.0**, which the old `.env.example` used, expires **21 Jan 2027**.

Pin a version and upgrade deliberately. Check the Graph API changelog for WhatsApp breaking changes
before you bump it.

## 6. Webhook

Meta must be able to reach your server over **public HTTPS**.

1. **Local development:** open a tunnel, e.g. `ngrok http 3000` or `cloudflared tunnel --url http://localhost:3000`,
   then set `NEXT_PUBLIC_APP_URL` to the tunnel URL. The in-memory store means the tunnel must point at
   the same `next dev` process you're looking at.
2. **Meta App Dashboard** → WhatsApp → Configuration → Webhook:
   - **Callback URL:** `https://<your-domain>/api/whatsapp/webhook`. Settings has a copy button.
   - **Verify token:** the value of `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
   - Click **Verify and save**. Meta sends a `GET` with `hub.mode=subscribe`, `hub.verify_token` and
     `hub.challenge`; Nidaa echoes the challenge back.
3. **Subscribe to the `messages` field.** It carries both inbound messages and delivery statuses.
   Also subscribing `message_template_status_update` is useful (see section 13).
4. **Subscribe your app to the WABA.** Without this you get no events. Use **Settings → Subscribe app**, or:
   ```bash
   curl -X POST "https://graph.facebook.com/v25.0/$WHATSAPP_BUSINESS_ACCOUNT_ID/subscribed_apps" \
     -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN"
   ```

**What the endpoint already does:**
- Verifies `X-Hub-Signature-256`, an HMAC-SHA256 of the **raw** body keyed with the App Secret, using a
  constant-time comparison. In production it rejects every request if the secret isn't set.
- Ignores events addressed to other phone number IDs.
- Returns `200` immediately and processes the events in `after()`. Meta retries any non-200 response,
  with decreasing frequency, **for up to 7 days**.
- Dedupes inbound messages by `wamid`, because those retries mean the same message can arrive more than once.
- Applies status updates in order (sent < delivered < read), with `failed` always winning, because
  status webhooks can arrive out of order.

## 7. Message templates

WhatsApp only lets a business **start** a conversation with an **approved template**. Nidaa needs
three, all defined in `src/lib/whatsapp/templates.ts`:

| Template | Sent when | Buttons (quick replies) | Category submitted |
|---|---|---|---|
| `nidaa_invitation` | "Send invitations", or a resend, for events without a photo/video | Attending · Can't make it · Maybe | MARKETING |
| `nidaa_invitation_image` | Same, when the event has a photo attached (image header) | same | MARKETING |
| `nidaa_invitation_video` | Same, when the event has a video attached (video header) | same | MARKETING |
| `nidaa_rsvp_reminder` | Chasing invited guests who haven't replied (manual or cron) | same | MARKETING |
| `nidaa_event_reminder` | N days before the event, to attending guests | See you there · Can't make it | UTILITY |

**To submit them**, use **Settings → Submit for review**, which calls
`POST /{waba-id}/message_templates`. Approval usually takes minutes, but can take up to 24h. The
Settings page shows live status.

**Category:**
- Meta treats a first, unsolicited event invitation as **marketing**. Its own marketing example is an event invite.
- Since April 2025, Meta automatically recategorizes a "utility" template it judges to be marketing,
  and re-checks approved templates every month.
- The event reminder goes to someone who already said yes, so it's a reasonable utility candidate.
  Meta may still reclassify it.

**What marketing means for you:**
- **Per-user marketing cap (error 131049).** Meta limits how many marketing templates a user receives
  from all businesses. If a send is held back, wait at least 24h before retrying, because retrying
  sooner can extend the block. Nidaa shows this hint in the drawer.
- **US (+1) numbers don't receive marketing templates.** Expect failures for US guests. Tell
  organizers, or offer another channel.
- Marketing messages cost more than utility ones (section 10).

**Rules to keep in mind when editing templates:**
- Body parameters (`{{1}}`, `{{2}}` …) can't contain newlines, tabs or more than 4 consecutive spaces.
  `clean()` in `src/app/actions.ts` collapses whitespace in event names, venues and guest names.
- Every parameter needs an example value at submission (`example` in the definition).
- Quick-reply button text is at most 25 characters, with at most 10 buttons. Templates with 4 or more
  buttons don't render on WhatsApp Desktop.
- **Each quick-reply button carries a `payload` set at send time**: `rsvp:<guestId>:<choice>`. A tap
  arrives as `type: "button"` with `button.payload`, so Nidaa knows exactly which guest and which event
  it's for, even when one phone number is invited to several events.
- If you change the wording of an approved template, re-submit it. Meta reviews edits again.
- To add more languages, create the same template name under each language code and send with the
  guest's language.

### Families: one invitation per household

Invitations go to the head of a family and cover the household:
- **Each guest has a size.** It's "people on this invitation": set on Add guest, from a CSV column such as "People", "Family size", "Party", "Seats" or "Pax", or from the event's usual family size.
- **The invitation says it:** "This invitation is for up to 5 people." That's the template's `{{6}}`.
- **"How many are coming?"** offers 1 up to that family's size, with "All 5 of us" as the last option. A reply above the size gets a polite note to contact the hosts.
- **The dashboard shows coming against invited:** per family ("3 of 5") and per event ("126 people coming, of 343 invited across 120 families").
- **The daily limit counts one message per head of family,** which is exactly how Meta counts it.

### Photo and video invitations

A template's header type is fixed when Meta approves it, so the invitation exists in three variants with identical wording. Nidaa picks the one that matches the event's attachment.

- **Uploading:** organizers attach the file on the event form. Files are stored under `.data/media/`, which is gitignored and local only. Move them to object storage, such as S3 or R2, with the database. Limits are WhatsApp's own:
  - **Photos:** JPG or PNG, up to 5 MB, 8-bit, no edge over 4096 px.
  - **Videos:** MP4 or 3GPP, up to 16 MB, H.264 video with AAC audio.
  - **Video encoding:** use the Main or Baseline profile and `-movflags faststart`. Android won't play High-profile video with B-frames.
- **Sending:** on the first send, Nidaa uploads the file once to `POST /{phone-number-id}/media` and reuses the returned media id for every guest. It re-uploads after 29 days, because ids expire after 30. No public URL is needed.
- **Submitting the templates:** Meta reviews media templates with a sample file. **Settings → Submit for review** uses the latest photo or video you've attached to any event, uploaded through the Resumable Upload API (`POST /{app-id}/uploads`, then `POST /upload:<id>`). This needs `WHATSAPP_APP_ID` (App Dashboard → App settings → Basic). Attach a photo, or a video, to an event before you submit the matching variant.

## 8. The 24-hour customer service window

When a guest messages you (a tap counts), a 24-hour window opens. Inside it you can send free-form
messages. Nidaa uses the window for:
- the party-size picker: interactive reply buttons for up to 3, or a list message for up to 10. List rows are limited to 24 characters and 10 rows; the open button to 20 characters.
  The answer arrives as `interactive.list_reply.id` = `party:<guestId>:<n>`.
- confirmations;
- the "didn't catch that" re-prompt, sent as interactive reply buttons: at most 3 buttons, titles at
  most 20 characters, and `button_reply.id` carries the same `rsvp:` payload.

Outside the window, only templates are allowed. A free-form send fails with **131047**.

## 9. Consent and policy

WhatsApp's Business Messaging Policy requires that each recipient:
- **gave you their number**, and
- **opted in to messages from your business**, with the business named clearly.

A guest list uploaded by an organizer is **not** opt-in by itself. What Nidaa does:
- **Attestation:** "Add guest" and "Import CSV" require the organizer to confirm that guests agreed to
  hear about the event on WhatsApp. Store this attestation with a timestamp once the database exists.
- **Naming the sender:** the invitation names the event, so guests can recognize it.

**Recommended next steps** (not yet built):
- Handle "STOP" and similar replies. Mark the guest as opted out and never message them again.
  WhatsApp also offers a built-in marketing opt-out button on marketing templates.
- Name the host or organizer in the invitation body, e.g. "Ayesha, Sara & Omar invite you to…".
- Show the opt-in wording in the organizer's terms of service.

Blocks and reports from guests lower your **quality rating**. A low rating can get templates paused
and limit your messaging. Keep an eye on it in WhatsApp Manager.

## 10. Limits, throughput and pricing

**Messaging limits** count unique users you start conversations with in a rolling 24h. They apply
across the **whole business portfolio** (since Oct 2025), not per number.
- **The tiers:** 250 → 2,000 → 10,000 → 100,000 → unlimited.
- **Reaching 2,000:** you get there through any one of business verification, partner verification,
  or 2,000 delivered high-quality templates to unique users in 30 days.
- **Above that:** limits rise automatically when quality is high and you've used at least half your
  current limit in the last 7 days.
- **What it means for Nidaa:** while unverified, at most 250 new guests a day can be invited across
  every organizer. A 300-guest wedding needs two days, and Nidaa handles that for you:
  - It counts the people it started conversations with in the last 24 hours, the same way Meta does: replies don't count, and someone already messaged doesn't use a second slot.
  - Sends that don't fit wait in a queue. The send dialog says so up front: "Send 250 now, queue 50".
  - The scheduler sends the queue as room frees up, oldest first. Queued messages go ahead of before-the-day reminders and chasers.
  - Set `WHATSAPP_DAILY_LIMIT` to your current limit: `250` until verified, then `2000` or higher, or `unlimited`.
  - The queue moves on the scheduler. Long-running servers (`next dev`, `next start`) run it in-process every 15 minutes, from `src/instrumentation.ts`. On serverless hosting, schedule `/api/cron/reminders` and set `NIDAA_SCHEDULER=off`.

**Throughput and sending:**
- The default throughput is 80 messages per second per number.
- The pair rate limit is about 1 message every 6 seconds to the same user. Error 131056 means you hit it.
- Nidaa currently sends invitations inline, with 5 sends in flight at a time. That's fine for hundreds
  of guests. For thousands, move sending onto a queue: BullMQ is already planned via `REDIS_URL`.
  Add rate limiting, and retries with backoff for 130429 and 131056.

**Pricing** has been per message since 1 Jul 2025:
- Marketing, utility and authentication templates are charged per delivered message, at rates that
  vary by recipient country.
- Rates change only on the 1st of a quarter.
- **(verify)** Several Meta partners report that **from 1 Oct 2026, service (free-form) messages are
  charged** at the utility rate, after 1,000 free per number per month. They also report that utility
  templates sent inside the 24h window are no longer free. Meta's pricing page still describes the old
  free rules. Check the rate card in WhatsApp Manager.
- Party-size questions and confirmations are free-form, so under the new rules they would cost money.
- You need a **payment method on the WABA**, or delivery stops.

## 11. Error codes Nidaa explains in the UI

| Code | Meaning | What to do |
|---|---|---|
| 131026 | Undeliverable: the number isn't on WhatsApp, terms aren't accepted, or the app is old | Check the number with the organizer |
| 131030 | Recipient isn't in the test number's allowed list | Add the recipient under API Setup, or use your real number |
| 131047 | More than 24h since the guest last messaged | Send a template instead |
| 131049 | Held back by the per-user marketing cap | Wait at least 24h, then retry once |
| 131050 | The guest stopped marketing messages from you | Don't retry |
| 131056 | Too many messages to the same guest too quickly | Back off and retry |
| 130429 | Throughput limit reached | Queue and retry |
| 132000 | Template parameter count doesn't match | Fix the parameters or the template |
| 132001 | Template isn't approved, or doesn't exist in that language | Check Settings → Message templates |
| 368 / 131031 | Account restricted or locked | Check WhatsApp Manager and Business Support |

The mapping lives in `ERROR_HINTS` in `src/lib/rsvp.ts`.

## 12. Testing, step by step

1. **Simulation mode (no Meta account needed).** Create an event, import guests and send invitations.
   Open a guest and use **Simulate a reply** (tap Attending, then type `3`). Try "maybe later" to see
   the "Needs attention" path.
2. **Webhook without Meta** (dev only, since signature checking is skipped while `WHATSAPP_APP_SECRET` is unset):
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/webhook -H 'content-type: application/json' -d '{
     "object":"whatsapp_business_account","entry":[{"id":"WABA","changes":[{"field":"messages","value":{
       "metadata":{"phone_number_id":"x","display_phone_number":"x"},
       "messages":[{"from":"971501173382","id":"wamid.TEST1","timestamp":"1791180000","type":"text","text":{"body":"Yes"}}]}}]}]}'
   ```
   **With a secret set**, sign the exact body:
   ```bash
   SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$WHATSAPP_APP_SECRET" | sed 's/^.* //')
   curl -X POST .../api/whatsapp/webhook -H "x-hub-signature-256: sha256=$SIG" -H 'content-type: application/json' -d "$BODY"
   ```
3. **Test number.** Set the env vars and add your own phone as an allowed recipient. In **Settings → Send
   test message**, send `hello_world`. Then submit the templates and wait for approval.
4. **End to end.** Add yourself as a guest on an event, send the invitation, tap a button on your phone
   and watch the drawer update. You may need to reopen it, since the dashboard refreshes on navigation
   rather than live.
5. **Reminders.** Use **Settings → Run reminders now**, or:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/reminders
   ```
   In production, schedule it hourly (Vercel Cron, GitHub Actions, or any cron service).

## 13. Before going to production

- [ ] **Database.** The store is in memory (`src/lib/store.ts`) and resets on restart. It also can't
  work on serverless hosts, where the webhook and the dashboard may run in different instances.
  Re-implement `store.ts` on Postgres (`DATABASE_URL` is already in `.env.example`). Add a unique index
  on inbound `wamid`, and an index on outbound `wamid` for status lookups.
- [ ] **Auth and tenancy.** Wire up Auth.js. Every server action in `src/app/actions.ts` must check the
  session, and that the event or guest belongs to the caller's organization.
- [ ] **Queue.** Move bulk sends and reminders onto BullMQ, or another queue, with rate limits and retries.
- [ ] **Cron.** Schedule `/api/cron/reminders` hourly with `CRON_SECRET` set.
- [ ] **Template status webhooks.** Subscribe to `message_template_status_update` and alert when a
  template is paused, disabled or recategorized.
- [ ] **Quality rating.** Watch the quality rating and messaging limit, e.g. a daily `GET /{phone-number-id}`.
- [ ] **Opt-out.** Handle STOP, and keep the consent attestation per guest (section 9).
- [ ] **Message logs.** Decide on a retention period for message logs. They're personal data.
- [ ] **Secrets.** Rotate the System User token if it leaks. Keep the App Secret and token out of logs.
- [ ] **API version.** Plan the next Graph API version upgrade before v25.0 expires (Jul 2028).

## Sources

- Graph API versions: https://developers.facebook.com/docs/graph-api/changelog/versions
- Webhooks: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks
- Messages API and interactive buttons: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/interactive-reply-buttons-messages
- Template components: https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components
- Template categorization: https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines
- Marketing per-user limits: https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates/per-user-limits/
- Messaging limits: https://developers.facebook.com/documentation/business-messaging/whatsapp/messaging-limits
- Throughput: https://developers.facebook.com/documentation/business-messaging/whatsapp/throughput
- Pricing: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
- Access tokens: https://developers.facebook.com/docs/whatsapp/access-tokens
- Error codes: https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes
- Opt-in: https://developers.facebook.com/docs/whatsapp/overview/getting-opt-in
- Embedded Signup and Tech Providers: https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/overview/
