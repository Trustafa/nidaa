# Nidaa — Product

## What it is
Nidaa is a multi-tenant SaaS that runs event RSVPs entirely over WhatsApp. It is built primarily
for **weddings** but works for any event. An organizer signs up, creates an event, uploads a guest
list, and Nidaa sends each guest a WhatsApp invitation with tap-to-reply buttons (Attending /
Can't make it / Maybe). Nidaa tracks every reply, automatically chases guests who don't respond or
reply invalidly, and sends reminders before the event. A live dashboard shows RSVP status and
confirmed headcount.

## Who uses it
- **Organizers** — wedding planners, couples, and event hosts. Often non-technical. They live in
  the dashboard: creating events, importing guests, sending invites, and watching responses arrive.
- **Guests** — never touch the dashboard. Their entire experience is in WhatsApp: receive an
  invitation, tap a button, optionally confirm party size, receive reminders.

## Core jobs to be done
1. Get an event set up and a guest list imported in minutes (CSV or manual).
2. Send invitations to everyone at once and trust the right message reaches each guest.
3. See at a glance who's coming, who declined, and the total headcount.
4. Stop manually chasing people — Nidaa auto-reminds non-responders and nudges before the event.
5. Handle the messy middle: invalid replies, party-size changes, individual resends.

## Key screens
- **Dashboard home** — all events with at-a-glance RSVP progress.
- **Event detail** — the heart of the product: headcount summary, filterable guest table, bulk
  send actions, CSV import.
- **Guest drawer** — one guest's RSVP, party size, and full WhatsApp message timeline.
- **Event create/edit**, **Auth**, **Settings** (org + WhatsApp connection status).

## Tone & feel
Calm, trustworthy, and quietly celebratory. Organizers are often planning one of the most important
days of their lives — the product should feel reassuring and in control, never cluttered or
anxiety-inducing. Weddings lean warm and elegant, but this is a **working dashboard**, not a
decorative invitation: clarity and confidence first, with moments of warmth. Avoid kitschy wedding
clichés (no script fonts everywhere, no heavy floral ornamentation).

## Non-goals (MVP)
- No guest-facing web pages — WhatsApp is the only guest surface.
- No billing/payments yet.
- English only for now.
