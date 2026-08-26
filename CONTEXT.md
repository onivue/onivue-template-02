# Domain model

The vocabulary this codebase is written in. Architectural terms (module, interface, depth,
seam, adapter, leverage, locality) come from the `codebase-design` skill and are not repeated here.

## Viewer

The person behind the current request, as far as the app is concerned: `{ id, email, name, image }`.

A Viewer is derived from a Better Auth session, but it is deliberately narrower — it carries only
what the UI renders. Code should ask for a Viewer, not a session; "session" refers to the Better
Auth record and its cookie, and belongs to `lib/auth` internals.

There is no Viewer when nobody is signed in, and also none when the session lookup fails. Failure
is deliberately indistinguishable from absence: a database outage signs people out rather than
crashing the page. This policy lives in exactly one place, `resolveViewer`.

Lives in [`src/lib/auth/viewer.ts`](src/lib/auth/viewer.ts).

- `getViewer()` — the render pass. Deduped per request, so any number of server components can ask.
- `getViewerFrom(headers)` — the proxy pass, which runs before rendering and cannot share that cache.
- `requireViewer()` — narrows `Viewer | null` to `Viewer`. The proxy has already gated these routes;
  this exists for the type, not for the guard.

## Account Action

Something a Viewer does to their own account: send a login link, sign in with a passkey, register,
add or delete a passkey, change email, update profile info, sign out.

Every Account Action follows one ritual — call the gateway, normalise whichever error channel
fired, tell the person what happened, then apply its success effect. The ritual is not repeated
per action; the actions differ only in their message copy and their declared effect.

An Account Action reports through an outcome (`{ ok: true } | { ok: false; message }`) *and* fires
its effects. The outcome is a convenience for callers that need to branch, such as resetting a
form; it is not how the work gets done.

Lives in [`src/lib/auth/account-actions.ts`](src/lib/auth/account-actions.ts), with
`useAccountActions` binding it to React state.

## Profile

A Viewer's optional self-description: **username** (unique, case-insensitive), **first name** and
**last name**. All three are validated on both sides of the wire from one shared source, and both
reject words on a blocked list — profanity, slurs and similar terms.

- `src/lib/profile/profile-schema.ts` — the shared Zod schemas (length, character pattern, blocked
  words) and the `additionalFields` config, used by both `auth.ts` and `auth-client.ts` so the two
  never drift apart.
- `src/lib/profile/profanity-filter.ts` — `ProfanityFilter`, a small word-list matcher that folds
  case, diacritics, the German eszett and common leetspeak substitutions before comparing, so
  simple obfuscation does not slip through.

The username itself is handled by better-auth's own `username` plugin (uniqueness, normalisation,
format), configured with the shared pattern and the profanity filter as its validator. First and
last name have no equivalent plugin, so they are validated in a `databaseHooks.user.update.before`
hook in `auth.ts`, which throws a `better-auth` `APIError` the client already knows how to surface
(see Account Action's `AuthErrorHelper`).

## Auth Gateway

The narrow port over the Better Auth client: the six operations Account Actions actually invoke.

It exists so Better Auth's types stop at one file and so tests can drive the actions against a
fake. `authGateway` is the production adapter; tests supply their own.

## Email Gateway

The port for outbound authentication email: one `send(message)`, where the message names its own
kind (`magic-link`, `email-change`).

Message kinds are data, not methods — adding a new email adds a template entry, not an interface
member. Two adapters sit behind it: `ResendGateway` in production, `InMemoryEmailGateway` in tests.

## Route Registry

The single declaration of what routes exist. Each route states its path, its **access**, and
whether it appears in navigation.

Access is three-way:

- `public` — no session needed (`/landing`)
- `guest` — only *without* a session; a signed-in Viewer is redirected away (`/login`, `/register`)
- `viewer` — a Viewer is required (everything else)

Unknown paths resolve to `viewer`, so the proxy denies by default. `matchesRoute` is the one path
predicate; `/` matches exactly, since it would otherwise prefix-match every path.

Icons are deliberately *not* in the registry — the proxy imports it, and icons would follow them
into that bundle. They live in `navigation.config.ts`, keyed by route name.

Lives in [`src/config/routes.ts`](src/config/routes.ts).

## Magic Link

A single-use sign-in URL emailed to a person, valid for 15 minutes. Used for both first
registration and returning sign-in — the app does not have separate credentials.

A **callback URL** may ride along, saying where to land after verification. Callback URLs are
untrusted input: anything not an internal path, and anything pointing at a `guest` route, is
replaced with the account route.

## Passkey

A WebAuthn credential bound to one device, created *after* a first Magic Link sign-in. A Viewer may
hold several. The **relying party id** is derived from the base URL, with the loopback address
mapped to `localhost` because WebAuthn rejects bare IPs.

## Conventions this model assumes

- UI copy is German. It is centralised per module (message catalogues, email templates) rather
  than inlined at call sites.
- Results cross seams as discriminated unions, never as thrown exceptions.
- Modules accept their dependencies; they do not construct them. `auth.ts` is the wiring point.
