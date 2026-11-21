---
version: 1
slug: "src-app-dashboard-layout-tsx"
primary_target: "src/app/(dashboard)/layout.tsx"
related_targets: []
---

# Organizer dashboard (all routes under src/app/(dashboard))

Scope: the whole organizer portal — home, events, event detail + guest drawer, new/edit event, guests, settings. Mode: Operate.

Audience: couples and families running their own wedding, mostly on phones in the evening at home; also planners. Job: see who's coming, send invitations, chase the quiet ones, fix odd replies. Constraint: keep the Nidaa script wordmark; everything else in the old look was rejected as "AI-made" (generic cards and pills, bland type, washed-out colour, robotic copy).

Adaptation (recorded): on phones the navigation lives in a bottom tab bar in the cover blue instead of the cover bar. The primary users are on phones, and four destinations need thumb reach; the cover bar keeps only the wordmark and the host's name.

Memorable moment: a reply lands and its ballpoint mark draws itself in the margin; the hand-summed seat count at the foot of the list changes.

## Direction contract

THESIS: The portal is the guest list a family actually keeps — a blue-ruled notebook with a red margin, ballpoint ticks beside names, totals summed at the foot. It refuses the SaaS default of bordered cards, stat tiles and status pills.

OWN-WORLD: Exercise-book cover blue shell (sidebar / phone top bar) carrying the rose script wordmark; white page; rule-blue hairlines between rows; one red margin rule down every list; ballpoint-blue ink for primary actions, marks and hand totals; Hanken Grotesk for UI, Kalam only for the ballpoint layer (marks, margin notes, totals). No pills, no card shells, radii ≤6px.

STORY: The host opens Nidaa and immediately reads it like their own list: who's ticked, who's crossed out, who still has a blank margin, and how many seats to set. They act from the same page: send, remind, fix.

FIRST VIEWPORT: Phone: cover-blue bar with wordmark and nav; greeting naming how many haven't replied; each event as a notebook entry (name, date/venue, a tally line of yes/maybe/no/waiting, "Seats to set" summed in ballpoint with a double underline, its open action). Desktop: cover-blue sidebar, page with margin rule; event detail leads with the hand total and the ruled guest table, margin marks at left.

FORM: Family guest book, candidate 1 (IMPECCABLE'S PICK) on my ordered list; seed key 6d795dde. Signature move: ballpoint margin marks (tick/cross/?/!/blank) drawn as SVG strokes that draw themselves on status change, plus double-underlined ballpoint totals.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
