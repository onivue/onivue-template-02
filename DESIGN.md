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
- `design-input`: pill-shaped form field at `--control-height`, with focus, invalid, and disabled states.
- `design-field-error`: inline validation message under a field.
- `design-divider`: uppercase divider with a rule on each side.

Anything interactive is a `Button` (`src/components/ui/button.tsx`) rather than a hand-styled element, so focus rings, disabled states, and touch targets stay identical everywhere:

- `variant='strong'` + `size='xl'`: the primary action (dark pill, lime label).
- `variant='outline'` + `size='xl'`: the secondary action beside it.
- `size='xl'` matches `--control-height`, so a button always lines up with the input next to it.

Sidebar navigation uses `bg-sidebar-accent` for the active item and `text-sidebar-accent` for supporting icon emphasis. Inactive items stay muted on the dark surface and reveal a subtle accent tint on hover. The mobile bar reuses the same sidebar tokens, so both navigation surfaces stay in step.

The account control belongs to a shell, not to the window: the app shell renders it at the foot of its navigation (desktop sidebar and mobile drawer alike), the landing page renders it in its header. Auth screens live in the `(auth)` route group, stay visually separate from the app navigation, and render no account control at all — those pages carry their own sign-in and sign-up actions.
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
