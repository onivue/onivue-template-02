# Design System

## Direction

The interface follows a refined, app-like event-management aesthetic: warm off-white canvas, near-black surfaces, high-contrast typography, and a bright lime action accent. Keep the structure calm and utilitarian, but make primary actions feel tactile and immediate.

## Typography

- Primary font: `Space Grotesk` via `next/font/google`.
- Font stack: `var(--font-space-grotesk), 'Space Grotesk', 'Space Grotesk Fallback'`.
- Headings use tight line-height, strong weight, and zero letter spacing.
- Labels and small navigation text use bold weight and uppercase only where status or eyebrow semantics require it.

## Color Tokens

- Canvas: `--background`, warm off-white.
- Ink: `--ink`, near-black for dominant text and dark controls.
- Soft ink: `--ink-soft`, muted gray for metadata and secondary text.
- Accent: `--lime-glow`, vivid lime for active navigation and primary actions.
- Cards: `--surface-elevated`, white elevated panels with subtle borders.
- Borders: `--border`, warm neutral gray.
- Navigation surface: `--sidebar-primary`, near-black.
- Sidebar accent: `--sidebar-accent`, lime used for active sidebar items, icon tint, and drawer close controls.

Use semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`) or the design utilities below. Avoid introducing raw Tailwind color families in components.

## Utility Classes

Global design utilities live in `src/app/globals.css` under `@layer utilities`:

- `design-shell`: page-level canvas and foreground color.
- `design-footer`: subtle centered creator credit for root pages and sidebar placement.
- `design-panel`: elevated white panel with soft border and shadow.
- `design-page-title`: large Space Grotesk display title.
- `design-page-copy`: muted supporting copy.
- `design-eyebrow`: compact lime-tinted label.
- `design-action-dark`: dark pill action with lime text.
- `design-landing-shell`: full-height landing canvas with independent safe-area padding.
- `design-landing-container`: landing content grid that separates header and hero spacing.
- `design-landing-header`: compact landing header row.
- `design-landing-hero`: centered landing hero area with controlled vertical padding.
- `design-mobile-bar`: floating near-black mobile navigation shell.
- `design-mobile-item-active`: lime active navigation state.
- `design-mobile-item-muted`: muted inactive mobile navigation state.
- `design-mobile-fab`: lime circular floating action treatment.
- `design-auth-shell`: centered auth route canvas.
- `design-auth-card`: compact rounded white auth panel with subtle elevation.
- `design-auth-title`: strong compact auth heading.
- `design-auth-copy`: secondary auth text.
- `design-auth-label`: uppercase auth field label.
- `design-auth-input`: pill-shaped auth email input.
- `design-auth-button-dark`: near-black pill CTA with lime text.
- `design-auth-button-outline`: white pill secondary auth action.
- `design-auth-divider`: uppercase divider with horizontal rules.

Sidebar navigation should use `bg-sidebar-accent` for the active item and `text-sidebar-accent` for supporting icon emphasis. Inactive items should remain muted on the dark surface and only reveal a subtle accent tint on hover.

Auth screens live in the `(auth)` route group and should stay visually separate from the app navigation. They use the auth utility classes above and are designed for future Magic Link and Passkey logic.
Auth cards should remain compact and focused: narrow max width, moderate padding, pill controls, and restrained dialog-scale typography.

## Shape And Motion

- App shell: large but controlled radii, no decorative gradients or orbs.
- Floating mobile navigation: pill shape, near-black, with soft shadow.
- Drawer navigation: full-width bottom drawer with rounded top corners only.
- Motion should feel springy but restrained; use `motion/react` for drawer transitions.

## Usage Rules

- Prefer existing shadcn components and semantic tokens.
- Do not change application structure solely to match mockups; apply this design language through tokens and utilities first.
- Keep mobile safe-area handling on fixed bottom elements.
- Use `data-testid` on visible layout and navigation elements.
