---
name: Nidaa
description: The family guest book for WhatsApp RSVPs: a cover-blue notebook, a white ruled page, a red margin, and ballpoint marks beside every name.
colors:
  bg: "oklch(1 0 0)"
  surface: "oklch(0.975 0.008 250)"
  cover: "oklch(0.45 0.13 257)"
  cover-deep: "oklch(0.39 0.12 258)"
  cover-ink: "oklch(0.98 0.01 262)"
  cover-ink-muted: "oklch(0.9 0.035 262)"
  ink: "oklch(0.22 0.02 262)"
  ink-muted: "oklch(0.44 0.02 262)"
  ink-faint: "oklch(0.53 0.018 262)"
  line: "oklch(0.89 0.03 250)"
  line-strong: "oklch(0.8 0.045 250)"
  control: "oklch(0.64 0.05 255)"
  margin: "oklch(0.72 0.12 22)"
  brand-050: "oklch(0.965 0.02 265)"
  brand-100: "oklch(0.93 0.04 265)"
  brand-300: "oklch(0.72 0.11 265)"
  brand-500: "oklch(0.5 0.17 265)"
  brand-600: "oklch(0.43 0.18 265)"
  brand-700: "oklch(0.37 0.17 265)"
  rose: "oklch(0.87 0.07 5)"
  gold: "oklch(0.86 0.1 85)"
  attending-ink: "oklch(0.45 0.12 150)"
  declined-ink: "oklch(0.48 0.15 25)"
  declined-bg: "oklch(0.965 0.02 25)"
  declined-dot: "oklch(0.56 0.17 25)"
  maybe-ink: "oklch(0.5 0.11 70)"
  maybe-bg: "oklch(0.97 0.04 90)"
  pending-ink: "oklch(0.5 0.02 262)"
  invalid-ink: "oklch(0.5 0.14 45)"
  chat-surface: "oklch(0.95 0.015 90)"
  wa-sent: "oklch(0.94 0.06 145)"
  wa-button: "oklch(0.5 0.09 200)"
  highlight: "oklch(0.9 0.08 95)"
typography:
  display:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "2rem (2.5rem from 768px)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
    fontFeature: "ss01"
  headline:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.55
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "ss01"
  label:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
  meta:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  hand-total:
    fontFamily: "Kalam, cursive"
    fontSize: "2.25rem to 4rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  hand-note:
    fontFamily: "Kalam, cursive"
    fontSize: "0.9375rem to 1.125rem"
    fontWeight: 400
    lineHeight: 1.25
  wordmark:
    fontFamily: "Great Vibes, cursive"
    fontSize: "2.75rem (2rem compact)"
    fontWeight: 400
    lineHeight: 1
  wordmark-tag:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    letterSpacing: "0.28em"
rounded:
  sm: "3px"
  md: "5px"
  lg: "6px"
spacing:
  hairline-gap: "4px"
  row-y: "12px"
  gutter-phone: "20px"
  entry-y: "24px"
  margin-x: "36px"
  margin-x-list: "48px"
  header-gap: "40px"
  gutter-desktop: "48px"
  section-gap: "56px"
components:
  button-primary:
    backgroundColor: "{colors.brand-600}"
    textColor: "{colors.bg}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.brand-700}"
  button-secondary:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-secondary-hover:
    textColor: "{colors.brand-700}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.declined-ink}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    height: "40px"
  button-danger-hover:
    backgroundColor: "{colors.declined-bg}"
  input:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  sidebar:
    backgroundColor: "{colors.cover}"
    textColor: "{colors.cover-ink}"
    width: "240px"
  sidebar-item-current:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px 10px 12px"
  sidebar-item-hover:
    backgroundColor: "{colors.cover-deep}"
    textColor: "{colors.cover-ink}"
  phone-tab-bar:
    backgroundColor: "{colors.cover}"
    textColor: "{colors.cover-ink-muted}"
    typography: "{typography.label}"
  status-word:
    textColor: "{colors.attending-ink}"
    typography: "{typography.label}"
  guest-row:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "12px 4px 12px 0"
  guest-row-hover:
    backgroundColor: "{colors.surface}"
  guest-row-selected:
    backgroundColor: "{colors.brand-050}"
  hand-total:
    textColor: "{colors.brand-600}"
    typography: "{typography.hand-total}"
  guest-drawer:
    backgroundColor: "{colors.bg}"
    width: "448px"
  chat-panel:
    backgroundColor: "{colors.chat-surface}"
    padding: "20px"
  toast:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  modal:
    backgroundColor: "{colors.bg}"
    rounded: "{rounded.lg}"
    padding: "24px"
    width: "448px"
  practice-banner:
    backgroundColor: "{colors.maybe-bg}"
    textColor: "{colors.maybe-ink}"
    typography: "{typography.meta}"
    padding: "8px 20px"
---

# Design System: Nidaa

## Overview

**Creative North Star: "The Family Guest Book"**

Nidaa is the guest list a family actually keeps: an exercise book with a blue card cover, white pages printed with pale blue rules and one red margin line, and the host's ballpoint ticks, crosses and question marks beside each name. Totals are summed at the foot of the column in pen and underlined twice. Everything the product prints (names, dates, labels, controls) is set in a warm grotesque; everything the host "wrote" (marks, margin notes, party sizes, totals, countdowns) is in ballpoint. The cover holds the rose script name. Nothing else is decorated.

The register is a working tool used mostly on a phone in the evening, so the page is dense where it needs to be (guest rows at 12px vertical padding, one name per line) and quiet everywhere else. Separation comes from ruled lines, not boxes: hairlines between rows, a dark rule under each heading, a double rule above a total. There are no card shells, no stat tiles, no status pills and no gradients. Depth exists only for things lifted off the page: the guest drawer, a dialog, a toast.

This world replaces an earlier generic SaaS look (bordered cards, pills, a mauve accent, Geist type) that the owner rejected as machine-made. The still-true principles carry over: clarity over decoration, status never shown by colour alone, WCAG contrast, tabular numerals, and respect for reduced motion.

**Key Characteristics:**
- Cover-blue shell (desktop sidebar, phone top bar and bottom tab bar) holding the rose script wordmark with its gold "RSVP Service" tag.
- White page; 1px rule-blue hairlines between rows; one 1px red margin rule down every list.
- One ballpoint blue for primary actions, every margin mark, and every hand-written number.
- RSVP state = an SVG pen mark in the margin + a coloured word. Never a pill, never colour alone.
- Hand-summed seat totals in Kalam with a drawn double underline.
- WhatsApp-faithful chat surface inside the guest drawer.
- Radii no larger than 6px; flat paper with shadows reserved for lifted layers.

## Colors

A cool notebook palette: blue card cover, white paper, pale blue rules, a single red margin, blue-black ink and one saturated ballpoint blue, with rose and gold only on the cover. All values are OKLCH and canonical in `src/app/globals.css`.

### Primary
- **Ballpoint Blue** (`brand-600`): the pen. Primary button fill, every `MarginMark` stroke, every hand total, party sizes, margin countdowns, quoted guest words, the active filter underline and the caret. `brand-700` is its pressed/hover depth; `brand-500` is the focus outline and the pen circle on calendar dates; `brand-300` the hover border on secondary controls; `brand-100` the focus ring halo on inputs; `brand-050` the selected guest row.

### Secondary
- **Exercise-Book Cover** (`cover`): the app shell. Desktop sidebar, phone top bar, phone bottom tab bar. `cover-deep` is the hover fill on cover nav items, the tab bar's top border, and (at 40–45% alpha) the scrim behind drawers and dialogs. Text on the cover is `cover-ink` (current/primary) and `cover-ink-muted` (resting nav, org name).

### Tertiary
- **Wordmark Rose** (`rose`): the script "Nidaa" and the short stroke under the current phone tab. It never touches the white page.
- **Tag Gold** (`gold`): the "RSVP Service" tag under the wordmark, nothing else.
- **Margin Red** (`margin`): the 1px margin rule down every list and today's underline in the calendar. It is a printed line, never text and never a state.

### Neutral
- **Paper** (`bg`): the page, drawer, dialog, toast, and the current sidebar tab that joins the page.
- **Page Edge** (`surface`): row hover, pressed rows on phones, ghost-control hover, code wells in Settings.
- **Ink** (`ink`): body text and headings; at 80% alpha it is the dark rule under headings, above lists and table heads, and the 2px rule above a foot total.
- **Ink Muted** (`ink-muted`): secondary text, meta lines, table headings, labels inside `dl`s.
- **Ink Faint** (`ink-faint`): placeholders, em-dash empties, "Not invited yet", inactive counts.
- **Rule** (`line`): hairlines between rows and inside lists.
- **Rule Strong** (`line-strong`): the dashed top of the practice-reply strip, scrollbars.
- **Control Outline** (`control`): borders of inputs, the search field and secondary buttons. 3.3:1 on white, so control boundaries meet WCAG's 3:1.
- **Chat Paper** (`chat-surface`, CSS `--wa-chat`): the warm WhatsApp backdrop behind message threads and template previews.
- **WhatsApp Sent** (`wa-sent`): the pale green of messages Nidaa sent, in the guest drawer. **WhatsApp Button** (`wa-button`): quick-reply button text in template previews. Both bubbles share one 1px green-tinted shadow (`--wa-shadow`). These exist only to make WhatsApp look like WhatsApp; never use them elsewhere.
- **Highlighter** (`highlight`): text selection only.

### RSVP inks
Each reply state has an ink for its word: Coming (`attending-ink`), Can't make it (`declined-ink`), Maybe (`maybe-ink`), No reply yet (`pending-ink`), Unclear reply (`invalid-ink`). `declined-bg` / `declined-dot` serve destructive hovers, failed-message bubbles and field errors; `maybe-bg` / `maybe-ink` carry the practice-run banner and strip. Every ink clears 6:1 on white.

### Named Rules
**The One Pen Rule.** Every mark and every number the host "wrote" is `brand-600`, regardless of state. The mark's shape carries the meaning; the colour belongs to the word beside it.

**The Rose Stays on the Cover Rule.** Rose and gold appear only on cover blue: the wordmark lockup and the current-tab stroke. Never on the white page, never on a button.

**The Mark-Plus-Word Rule.** A reply state is never colour alone: it is a pen mark (or a blank margin for "No reply yet") plus its word.

## Typography

**UI Font:** Hanken Grotesk (with system-ui, sans-serif), `ss01` on, via `--font-hanken`
**Ballpoint Font:** Kalam 400/700 (via `--font-kalam`, utility `font-hand`)
**Wordmark Font:** Great Vibes 400 (via `--font-script`, utility `font-script`)

**Character:** A warm, legible grotesque prints the book; a quick, upright handwriting fills it in. The script is the family name on the cover and nowhere else.

### Hierarchy
- **Display** (700, 2rem → 2.5rem at md, tight leading, −0.025em): the one page heading — greeting on Home, event name on the event page.
- **Headline** (700, 1.125rem, −0.01em): section headings written on the page ("Coming up", "Guest list", form legends), always sitting on a 1px `ink/80` rule.
- **Title** (700, 1.25rem, −0.015em): event names in entries, guest name in the drawer, dialog titles.
- **Body** (400/600, 0.9375rem): the working size for rows, tallies, buttons and inputs. Long copy holds to 52–60ch.
- **Label** (600, 0.875rem): field labels, status words, small actions, "Seats to set".
- **Meta** (400, 0.8125rem): phone numbers under names, table heads, the practice banner.
- **Hand Total** (Kalam 700, 2.25rem in list feet, 2.5rem on event entries, 4rem on the event headcount, leading 1, tabular): seat counts with a drawn double underline.
- **Hand Note** (Kalam 400–700, 0.9375–1.125rem): margin countdowns ("19 days"), "in 47 days", party sizes, quoted unclear replies, calendar event days.
- **Wordmark** (Great Vibes, 2.75rem sidebar / 2rem compact on phones) with the **Wordmark Tag** (Hanken 600, 0.625rem, uppercase, 0.28em tracking, gold) beneath it in the sidebar only.

### Named Rules
**The Three Hands Rule.** Hanken prints, Kalam writes, Great Vibes signs. Kalam only for what a host would pen (marks, notes, counts, totals); Great Vibes only for "Nidaa".

**The Even Columns Rule.** Every count, date, phone number and total uses tabular numerals (`.tnum` / `font-variant-numeric: tabular-nums`).

## Layout

The page is a single ruled sheet. Content sits in a centred column (max 72rem) with a 20px gutter on phones and 48px from 768px, 32px/48px top padding. A page opens with the display heading and its primary action on one baseline (`items-end`, wrapping), then 40px to the first section, 56px between sections.

**Lists run down a margin.** `.ruled-margin` draws a 1px `margin` line at `--margin-x` (default 36px). Rows are two-column grids, `[margin-x] 1fr`: the pen mark or countdown sits right-aligned left of the line, text starts 16–24px right of it. Observed margins: 40px on phone guest lists, 48px on guest tables, 52px → 72px (sm) on Home event entries.

**Row rhythm.** Guest rows 10–12px vertical; event entries 24px; every row ends on a 1px `line` hairline (the last row in an entry list drops it). Lists start under a 1px `ink/80` rule and close, when there are attending guests, with a 2px `ink/80` rule and the hand total right-aligned.

**Responsive.** Below 768px the sidebar disappears; a cover-blue top bar carries the compact wordmark and host name, and a fixed four-tab cover-blue bar at the bottom carries navigation (thumb reach for the phone-first audience), with 80px bottom padding on content and safe-area inset. The guest table becomes a one-name-per-line list below 640px. From 1280px Home adds a 19rem right column (calendar, "To look at") that sticks at 40px. Event detail actions and filters wrap rather than shrink; filters scroll horizontally on phones.

**Layering.** A semantic z-scale: dropdown 100, sticky 200 (phone tab bar), drawer backdrop 300 / drawer 310, modal backdrop 400 / modal 410, toast 500, tooltip 600.

### Named Rules
**The Margin Rule.** Every list of people or events runs down one red margin line; marks live left of it, words right of it. A list without a margin is not on the page.

## Elevation & Depth

Paper lies flat. The page and everything written on it has no shadow; hierarchy comes from rules (hairline, 1px ink, 2px ink), weight and the cover/page contrast. Shadows appear only on layers physically lifted over the page, and they are cast in cover-blue, not grey.

### Shadow Vocabulary
- **Pen-press** (`0 1px 2px oklch(0.3 0.1 265 / 0.25)`): the primary button only.
- **Toast lift** (`0 6px 18px -6px oklch(0.25 0.08 262 / 0.35)`): toasts.
- **Drawer edge** (`-12px 0 32px -12px oklch(0.25 0.08 262 / 0.35)`): the guest drawer's leading edge.
- **Dialog lift** (`0 24px 48px -16px oklch(0.25 0.08 262 / 0.45)`): modal dialogs.
- **Chat bubble** (`0 1px 1px oklch(0.3 0.03 150 / 0.15)`): WhatsApp bubbles, mimicking the app.

### Named Rules
**The Paper Lies Flat Rule.** Nothing on the page casts a shadow. If it needs separating, rule a line.

## Shapes

Small, practical corners: 3px (`sm`, bubble tails), 5px (`md`, buttons, inputs, toasts, nav tabs), 6px (`lg`, dialogs, chat bubbles, preview frames). Nothing larger; full rounding appears only on hairline-thin indicator strokes and the spinner. Borders are rules, not containers: horizontal hairlines and heading rules, a 1px vertical margin line, and a dashed rule for the practice-reply strip. The pen marks are open single strokes (1.9px, round caps and joins) on a 20px box; the double underline and the calendar's pen circle are loose hand-drawn paths, never geometric circles or boxes.

### Named Rules
**The Ruled-Not-Boxed Rule.** Group with rules and whitespace, never with a bordered card. The only boxed surfaces are lifted layers (drawer, dialog, toast) and the WhatsApp chat imitation.

## Components

### Buttons
Plain and pressed, like a stamp on paper.
- **Shape:** gently squared (5px), min height 40px (36px small), semibold 15px, icon gap 8px.
- **Primary:** ballpoint fill, white text, pen-press shadow; hover deepens to `brand-700`; active nudges down 1px. One primary per region.
- **Secondary:** white with a `control` border, ink text; hover turns border `brand-300` and text `brand-700`. Small variant 14px.
- **Danger:** no fill, `declined-ink` text; hover fills `declined-bg`. Confirm steps add a `declined-dot`/40 border.
- **Disabled:** 60% opacity, not-allowed cursor. Pending shows a 14px border spinner inside the button.

### Inputs / Fields
- **Style:** white, 1px `control` border, 5px corners, 8×12px padding, 15px text, `ink-faint` placeholder. Search fields carry a 16px icon at 12px inset.
- **Focus:** border becomes `brand-500` with a 2px `brand-100` ring. Global `:focus-visible` elsewhere is a 2px `brand-500` outline, 2px offset.
- **Error:** `aria-invalid` turns the border `declined-dot`; the message sits 6px below in 12px `declined-ink`. Hints use 12px `ink-muted`. Labels are 14px semibold ink above the control.

### Navigation
- **Desktop sidebar (240px, cover):** wordmark lockup at top; four items (16px icon + 15px label). Resting items are `cover-ink-muted`, hover `cover-deep` fill. The current item becomes a white index tab that bleeds into the page (left-rounded only, ink text, ballpoint icon). Host name and org at the foot above a 15%-ink rule.
- **Phone:** a cover top bar (compact wordmark, host name) and a fixed four-column cover tab bar at the bottom: 20px icons over 12px semibold labels, current tab in `cover-ink` with a 24×2px rose stroke underneath.
- **Filters:** text tabs, not chips. Inactive `ink-muted`; active ink semibold with a 2px ballpoint underline at 7px offset; each carries its count (ballpoint when active, faint otherwise).

### Margin Mark (signature)
The pen marks a host makes beside a name: tick (Coming), cross (Can't make it), question mark (Maybe), exclamation (Unclear reply), blank (No reply yet). Inline SVG strokes in ballpoint at 16px (tallies, status words), 20px (toasts, notes), 24px (guest rows). When a status changes after mount, each stroke draws itself (520ms, `cubic-bezier(0.32, 0.72, 0, 1)`, 160ms stagger between strokes). Always `aria-hidden`; the word next to it is the accessible label.

### Status Word
A reply written as a mark plus a 14px semibold word in its RSVP ink ("Coming", "Can't make it", "Maybe", "No reply yet", "Unclear reply"). No background, no border, no pill. In tables the mark lives in the margin column and the word stands alone.

### Hand Total (signature)
A seat count in Kalam 700 ballpoint with two slightly uneven pen strokes beneath it (1.6px, non-scaling). It sits right-aligned at the foot of a list after a 2px ink rule, labelled in plain print ("Seats to set", "Seats among these guests"), and leads the event headcount at 4rem.

### Event Entry
A notebook entry, not a card: margin countdown in ballpoint ("19 / days", "Today", "Past"), title-size event name linked across the whole entry, date and venue in muted body, a tally line of marks + counts ("40 coming · 4 maybe · 6 can't · 13 no reply yet · 1 unclear"), and the hand total at right. Hover nudges a trailing arrow 4px and inks it ballpoint.

### Guest Rows
Desktop: a real table under a 1px ink rule; mark column left of the margin, name semibold with phone and any note in 13px meta beneath, status word, party size in ballpoint Kalam, reply date tabular. Hover `surface`, selected `brand-050`. Unclear replies show the guest's own words in ballpoint quotes; failed sends show "Message didn't arrive" in `declined-ink`. Phone: one row per guest, mark · name/phone · status word with "party of N".

### Guest Drawer
A 448px panel from the right (full width on phones) over a `cover-deep`/40 scrim, sliding in over 220ms (`cubic-bezier(0.22, 1, 0.36, 1)`). Header: title-size name, phone, then a `dl` of Reply / Party / Event over a 1px ink rule. Body: the WhatsApp thread on chat paper; outbound bubbles pale WhatsApp green, right, with a squared top-right tail; inbound white, left, squared top-left; 12px meta with time and delivery ("Sent", "Delivered", "Read", "Not delivered", "Practice"). Failed bubbles turn `declined-bg` with a `declined-dot` border. A dashed-rule practice strip (on `maybe-bg`) lets the host reply as the guest while WhatsApp is unconnected. Footer actions: primary send/resend, secondary edit, danger remove with inline confirm.

### Calendar
A pocket-diary month under a headline rule: weekday initials faint, days muted, event days ringed with a loose ballpoint pen circle and set bold `brand-700`, today bold with a 16×2px margin-red underline. Events for the month are listed beneath with ballpoint day numbers.

### Toasts, Dialogs, Banners
- **Toast:** white, 5px, toast-lift shadow, a 20px margin mark (tick for success, exclamation for errors) and 15px text; bottom-centre on phones above the tab bar, bottom-right on desktop; 4.5s (8s for errors); enters 240ms rising 8px.
- **Dialog:** native `<dialog>`, white, 6px, 24px padding, max 448px (672px wide variant), `cover-deep`/45 backdrop, enters 180ms rising 8px.
- **Practice banner:** a full-width `maybe-bg` strip under the shell, 13px `maybe-ink`, plain-spoken ("messages are practice runs") with an underlined link to connect WhatsApp.

## Do's and Don'ts

### Do:
- **Do** write every mark, total, party size and countdown in ballpoint (`brand-600`) and every reply state as mark + word in its RSVP ink.
- **Do** run every list of people or events down a `.ruled-margin` with marks left of the line.
- **Do** separate with rules: `line` hairlines between rows, a 1px `ink/80` rule under headings and above lists, a 2px `ink/80` rule above a hand total.
- **Do** use tabular numerals for every count, date, phone number and total.
- **Do** keep text contrast at 4.5:1 or better (the inks here run 5.3:1 to 17:1 on paper) and focus visible as a 2px ballpoint outline.
- **Do** let marks draw themselves on status change, and honour `prefers-reduced-motion` (all animation collapses to 0.01ms).
- **Do** use the house words: "Coming", "Can't make it", "Maybe", "No reply yet", "Unclear reply", "Seats to set", "practice run". Name real people and numbers.
- **Do** keep the WhatsApp surfaces faithful to WhatsApp (chat paper, green outbound bubbles, squared tails, delivery ticks in words).

### Don't:
- **Don't** wrap content in bordered or shadowed cards, stat tiles or status pills.
- **Don't** colour a margin mark by status; the pen is one colour.
- **Don't** set UI text in Kalam or anything but "Nidaa" in Great Vibes.
- **Don't** put rose or gold on the white page.
- **Don't** round anything past 6px, or use side-stripe borders, gradient text, glassmorphism, or eyebrow labels over sections.
- **Don't** cast shadows from anything that sits on the page; only drawer, dialog, toast, the primary button's pen-press and chat bubbles lift.
- **Don't** show a reply state by colour alone, or use robotic copy ("Status: PENDING", "Submit").
