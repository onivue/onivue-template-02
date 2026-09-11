# Design System

## Direction

The interface follows a refined, app-like event-management aesthetic: warm off-white canvas, near-black surfaces, high-contrast typography, and a bright lime action accent. Keep the structure calm and utilitarian, but make primary actions feel tactile and immediate.

## Typography

- Primary font: `Space Grotesk` via `next/font/google`.
- Font stack: `var(--font-space-grotesk), 'Space Grotesk', 'Space Grotesk Fallback'`.
- Headings use tight line-height, strong weight, and zero letter spacing.
- Labels and small navigation text use bold weight and uppercase only for status and compact section labels.

## Color Tokens

Every token is defined for both themes in `src/app/globals.css`. Roles are kept separate, so nothing has to be re-picked per surface:

- Canvas: `--background`, warm off-white.
- Ink: `--ink`, dominant text color. **Text only** — never a control background.
- Soft ink: `--ink-soft`, secondary text and metadata. Held at ≥ 5:1 against the canvas.
- Accent: `--lime-glow`, vivid lime for accented surfaces (active navigation, badges, avatars).
- Readable accent: `--accent-strong`, the green used when the accent has to carry **text or icons** on a light surface — `--lime-glow` is far too light to read.
- Strong action: `--action-strong` / `--action-strong-foreground`, the near-black pill with lime text used for the single highest-emphasis action per view. The pair inverts in dark mode so the action keeps standing out.
- Cards: `--surface-elevated`, elevated panels with subtle borders.
- Borders: `--border`; form control borders: `--input`.
- Navigation surface: `--sidebar-primary`, with `--sidebar-accent` for the active item and icon emphasis.
- Control height: `--control-height`, the shared height of every input and form-level action.

Use semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `text-ink-soft`, `bg-action-strong`) or the design utilities below. Do not put raw `oklch(...)` values or Tailwind color families in components — if a value is missing, add a token.

## Utility Classes

Global design utilities live in `src/app/globals.css`:

- `design-panel`: elevated panel with soft border and shadow.
- `design-page-title`: large Space Grotesk display title.
- `design-page-description`: muted supporting description text.
- `design-section-label`: compact lime-tinted section label.
- `design-label`: uppercase field label.
- `design-control`: the surface, border, focus, invalid, and disabled states every form control shares. Not used directly — `design-input` and `design-textarea` build on it, so a control can never drift from the rest.
- `design-input`: pill-shaped form field at `--control-height`.
- `design-textarea`: the same surface for multi-line input, trading the pill and the fixed height for `rounded-2xl` and a minimum height.
- `design-form`: the vertical rhythm of a form — one gap between fields.
- `design-field`: one label and its control, with the gap between them.
- `design-field-error`: inline validation message under a field.
- `design-divider`: uppercase divider with a rule on each side.

Controls carry their own design: `Input` renders `design-input` and `Textarea` renders `design-textarea` without a call site asking for it, and `SelectTrigger` takes `size='field'` for the same pill at `--control-height`. Never re-apply those utilities at a call site, and never override a control's height — a form where the fields sit at different heights is the first thing a reader notices.

The app shell caps its content at `max-w-3xl` and centres it, and that is the only place the reading width is set — a page or a panel that narrows itself again only breaks the alignment with its neighbours. Everything inside that column stacks: form fields sit one under another at every size, never two across, so a wide screen reads exactly like a phone and each field gets the full width.

Every labelled input is a `FormField` (`src/components/ui/form-field.tsx`) rather than a hand-assembled label/input/error block. It owns the whole accessibility contract — label association, `aria-invalid`, `aria-describedby`, the error slot — and the test ids derived from its `id`: `{id}-field` on the label, `{id}-input` on the control, `{id}-error` on the message. Pass `type` and `autoComplete` as props; pass `labelSuffix` for anything that sits beside the label, like a "forgot password?" link. Never re-derive that wiring at a call site.

Anything interactive is a `Button` (`src/components/ui/button.tsx`) rather than a hand-styled element, so focus rings, disabled states, and touch targets stay identical everywhere:

- `variant='strong'` + `size='xl'`: the primary action (dark pill, lime label).
- `variant='outline'` + `size='xl'`: the secondary action beside it.
- `size='xl'` matches `--control-height`, so a button always lines up with the input next to it.

Sidebar navigation uses `bg-sidebar-accent` for the active item and `text-sidebar-accent` for supporting icon emphasis. Inactive items stay muted on the dark surface and reveal a subtle accent tint on hover. The mobile bar reuses the same sidebar tokens, so both navigation surfaces stay in step.

The account control belongs to a shell, not to the window: the app shell renders it at the foot of its navigation (desktop sidebar and mobile drawer alike). Auth screens live in the `(auth)` route group, stay visually separate from the app navigation, and render no account control at all — those pages carry their own sign-in and sign-up actions. The landing page at `/` carries none either: it is guest-only, so its header shows the same two actions instead.
Auth cards stay compact and focused: narrow max width, moderate padding, pill controls, and restrained dialog-scale typography.

## Readability

- Body and secondary text must reach 4.5:1 on its surface; `--ink-soft` and `--muted-foreground` are tuned for that. Do not lighten them per component.
- Labels and micro-copy stay at or above `0.7rem`. Uppercase tracking never goes past `0.14em`.
- Interactive targets stay at 44px or larger on mobile: navigation slots are `h-12`, form actions are `--control-height`.

## Shape And Motion

- Radii come from the scale only (`rounded-2xl`, `rounded-3xl`, `rounded-full`). No arbitrary `rounded-[…]` values.
- Large surfaces (app shell, sidebar, panels, auth card) share `rounded-3xl`; nested blocks and list rows use `rounded-2xl`; controls are pills.
- App shell: large but controlled radii, no decorative gradients or orbs.
- Floating mobile navigation: pill shape, near-black, with soft shadow.
- Drawer navigation: full-width bottom drawer with rounded top corners only.
- Motion should feel springy but restrained; use `motion/react` for drawer transitions.

## Usage Rules

- Prefer existing shadcn components and semantic tokens.
- Do not change application structure solely to match mockups; apply this design language through tokens and utilities first.
- Keep mobile safe-area handling on fixed bottom elements.
- Use `data-testid` on visible layout and navigation elements.

## Landing Page

The landing page is the app's root (`/`) and is guest-only: the proxy sends a reader who already has
a session to the event list, so the page reads no session itself and stays a static shell. Its
sections live in `src/components/landing/` and all share one shape — `LandingSection` with its
label, display title and one line of description — so a new section never invents its own heading
scale. It reuses the app's own language rather than a second, louder one: `design-panel` cards on
the canvas, `bg-sidebar-primary` for the two dark blocks (the guest-page section and the closing
call to action), `design-section-label` for the section labels, and `Button` at `size='xl'` for
every call to action. On the dark blocks the high-emphasis action is `variant='default'` — the
near-black `strong` pill would disappear there.

The hero's invitation preview (`LandingInvitationPreview`) is an illustration, not real data: it is
`aria-hidden`, and every fact it shows is also stated as text in the sections below it.

## Guest Pages

The invitation page at `/i/<token>` carries the app's own design — there is no per-event theme, and
nothing on it reads one. The title comes first, the host's greeting right under it, and then one of
two things — never both, because each says the same date and the same address:

- **When and where** (`InvitationFacts`) while the answer is still open: the weekday and full date
  on one side, the street and postal line on the other, each behind a bordered icon tile, separated
  by a hairline rule on wide screens and stacked on a phone. They are not metadata and must not be
  styled as such.
- **The two tiles** — the calendar download (`EventCalendarCard`) and the location card
  (`EventLocationCard`) — take their place once the guest has replied and at least one of their
  party said yes. A reader still deciding, or one who just declined, is not handed a date to save
  and directions they did not ask for.

Once — and only once — an answer has actually been saved, the page gets an ambient background that
answers back (`InvitationMood`): a soft `--accent-strong` wash with a subtle, ongoing confetti
shower (`canvas-confetti`) when at least one guest on the invitation said yes, a slow warm wash of
`--destructive` when nobody is coming — both washes share one breathing keyframe
(`invitation-mood-breathe`), only the colour differs. Nobody coming also gets a red panel above the
title, before anything else on the page (`InvitationDeclinedNote`) — the one thing a guest who
declined should read first, phrased for one person or for the whole invitation. While the response
window is still open it carries the reminder that the answer can still change, naming the same
deadline as the read-only summary below; the generic deadline line further down the page is
suppressed in this case rather than repeating it. It appears the moment the reply is stored and
greets the guest again on every return, because it is derived from the saved answer
(`resolveResponseMood`) rather than from the act of submitting; an open form, or one being edited
again, has a plain canvas. Both the panel and the background are decoration — the panel's message
stands on its own without one, the background layer is `aria-hidden`, never a pointer target, and
low enough in contrast that the panels above it keep their readability. `canvas-confetti` parses
its own colour strings rather than reading CSS custom properties, so `InvitationMood` is the one
place the lime, readable-accent and ink tokens are written out as hex — the same exception
`map-style.ts` makes for MapLibre, and for the same reason: the app renders light only, so there is
one palette to keep in step with `globals.css`. The shower runs on its own physics loop, so a
reader who asked for less motion gets no shower at all rather than a still frame; the red wash
still comes to rest instead of disappearing under `prefers-reduced-motion`.

`InvitationPage` owns that swap, so the `AnswerState` it turns on — has the guest replied, is
anybody coming — lives there rather than inside `InvitationForm`; the form reports each transition
back through `onAnswerChange`. Anything else would have the form deciding what the page above it
lays out.

Both are full-width tiles at panel weight, not text links: what somebody who said yes does next is
put the date in their calendar and find the way there, and a link between two cards is the one thing
they would miss. The location tile carries the map, the address, and the two map apps — nothing
else. There is no route button: each link opens the place in Apple Karten or Google Maps, where the
reader's own starting point is what a route needs anyway. Every link is derived from the stored
address (`src/lib/events/event-location.ts`); a host never pastes one in, so correcting a street can
never leave a stale pin behind. The host's own event page shows the same location card, so the two
can never drift.

The settings form (`EventDetailsForm`) asks for those fields in the order the guest reads them —
title, greeting, when, where — so a host is never editing one page in the shape of another.

The map is MapLibre GL JS on OpenFreeMap's OpenStreetMap tiles, drawn with a style of our own
(`src/lib/events/map-style.ts`) rather than a stock one: warm off-white ground, white streets, soft
grey buildings, matching the canvas it sits on. MapLibre parses its own colour strings and knows
nothing of the CSS custom properties, so that file is the one place where the tokens appear as hex —
keep it in step with `globals.css` and put map colours nowhere else. The map is `interactive: false`:
it is a picture of where to go, not a map to explore, and a grabbing map inside a scrolling
invitation traps a thumb on a phone. Attribution to OpenStreetMap stays on it; the licence requires
it.

Coordinates are filled in by the geocoder when the address is saved. When it cannot place an
address, the card simply appears without its map — the address and both links still work, so a
failed lookup never costs a guest the directions.
