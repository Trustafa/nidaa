# Nidaa

Event RSVPs over WhatsApp. Organizers create an event and import a guest list. Guests get a WhatsApp
invitation with tap-to-reply buttons. Nidaa tracks every reply and party size, chases guests who
haven't replied, and reminds attending guests before the event.

See [PRODUCT.md](PRODUCT.md) for the product and [DESIGN.md](DESIGN.md) for design intent.

## Run it

```bash
npm install
cp .env.example .env.local   # optional — the app runs without WhatsApp credentials
npm run dev
```

Open http://localhost:3000.

**Simulation mode.** Without WhatsApp credentials Nidaa runs in simulation mode: sends are recorded
in each guest's timeline but never leave the server. The guest drawer has a "Simulate a reply" panel,
which runs replies through the same code path as the real webhook.

**Demo data.** The data lives in an in-memory store seeded with demo events. It resets whenever the
server restarts.

## Connect WhatsApp

Follow **[docs/whatsapp-setup.md](docs/whatsapp-setup.md)**. It covers:
- the Meta accounts you need, and the phone number;
- a permanent access token;
- webhooks;
- message templates and their categories;
- consent;
- messaging limits and pricing;
- error codes;
- a production checklist.

Once credentials are set, **Settings** shows the live connection status and template approval. It
also lets you send a test message.

## Layout

| Path | What |
|---|---|
| `src/app/(dashboard)` | Dashboard pages: home, events, event detail/new/edit, guests, settings |
| `src/app/actions.ts` | Server actions for every mutation |
| `src/app/api/whatsapp/webhook` | Meta webhook (verification + inbound messages and statuses) |
| `src/app/api/cron/reminders` | Hourly chasers and pre-event reminders |
| `src/lib/store.ts` | Data access (in-memory; swap for Postgres here) |
| `src/lib/rsvp.ts` | RSVP conversation engine |
| `src/lib/whatsapp/` | Cloud API config, client, templates, webhook parsing |
