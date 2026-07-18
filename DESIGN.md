# Nidaa — Design

## Register
**Product-driven**, with a thread of warmth. Nidaa is a working dashboard where organizers track
high-stakes events, so the primary register is a focused, legible product UI (think Linear / Stripe
dashboard clarity). The wedding context adds warmth and a celebratory undertone — but expressed
through restraint, generous space, and a single refined accent, not ornament.

## Principles
- **Clarity over decoration.** Status and headcount must be readable in a glance. Data density is
  fine; visual noise is not.
- **Confidence.** Sending invitations to real guests is a high-stakes action — confirmations,
  clear send states, and trustworthy feedback matter more than flourish.
- **Quiet warmth.** Reserve warmth for empty states, success moments (an RSVP arrives), and the
  marketing surface. The dense working views stay calm and neutral.

## Color
- Seed tokens with Impeccable's palette tool; use OKLCH throughout.
- **Neutral base**: cool-to-true neutral surfaces (avoid warm-beige body backgrounds as a default).
- **Accent**: one refined, slightly warm accent for primary actions and brand moments.
- **Semantic status colors** are first-class (used constantly in the guest table):
  - Attending → success/green, Declined → muted red, Maybe → amber, Pending → neutral/gray,
    Invalid/needs-attention → distinct warning.
  Keep these distinguishable for color-blind users (pair with icon/label, not color alone).
- Verify WCAG: ≥4.5:1 for body text, ≥3:1 for large text and UI affordances.

## Typography
- Max 3 font families. A clean humanist/grotesque sans for UI; optionally one warmer display face
  for marketing/headers only — not inside the dashboard tables.
- Body line length 65–75 characters; type scale ratio ≥1.25.
- Tabular numerals for headcount and counts.

## Layout & spacing
- Generous whitespace around summary cards; denser, scannable rows in the guest table.
- Vary spacing for rhythm; semantic z-index scale for the guest drawer/modals.
- Flex for 1D, grid for 2D. Responsive: dashboard must be usable on a phone (organizers check on
  the go), table collapses to cards on small screens.

## Motion
- Intentional only; ease-out curves. Animate meaningful state changes (an RSVP flipping status, a
  toast confirming a send). Always honor `prefers-reduced-motion`.

## UX copy
- Plain, specific, reassuring. "Send invitations to 142 guests" beats "Submit". Name real numbers.
- Avoid buzzwords and wedding clichés.

## Bans (from Impeccable, enforced here)
- No side-stripe borders, gradient text, default glassmorphism, identical card grids, eyebrows on
  every section, numbered scaffolding markers, or over-rounded corners (32px+).

## Tokens
Design tokens (color, spacing, radius, type scale) live in the Tailwind theme / CSS variables and
are seeded/refined via Impeccable. This file is the source of intent; tokens are the source of truth.
