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
add or delete a passkey, change email, update profile info, sign out, disconnect an MCP Connection,
decide on a consent request.

Every Account Action follows one ritual — raise busy, call the gateway, normalise whichever error
channel fired, tell the person what happened, apply its success effect, clear busy. The ritual is
not repeated per action; the actions differ only in their message copy and their declared effect.

An Account Action reports through an outcome (`{ ok: true } | { ok: false; message }`) *and* fires
its effects. The outcome is a convenience for callers that need to branch, such as resetting a
form; it is not how the work gets done.

Every effect is a port: `notify`, `navigate`, `invalidate`, `busy`. Busy carries the action name and,
where a list has rows, the id of the row it is running against, so one row can spin without
disabling the rest (see ADR-0003).

Lives in [`src/lib/auth/account-actions.ts`](src/lib/auth/account-actions.ts). `useAccountActions`
builds the four adapters and hands the module back — it does not re-declare the actions.

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

The narrow port over everything an Account Action invokes. Mostly the Better Auth client, but not
only: `revokeConnection` is backed by a server action, and the port is what makes that
indistinguishable to the action calling it.

It exists so Better Auth's types stop at one file and so tests can drive the actions against a
fake. `authGateway` is the production adapter; tests supply their own.

Members answer with `{ data?, error? }`. Most actions ignore the payload; the one that does not is
the consent decision, which needs the redirect target the provider chose.

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

## Agent Session

One authenticated MCP request: which Viewer an agent is acting for, and which Scopes they granted
it. Built once from the access token's verified claims — `sub` becomes the identity, `scope` becomes
the grant — and handed to the tools.

There is no session without a verified `sub`; an agent that reaches the endpoint without one gets a
server with no tools registered at all.

Tools receive a Session, never a user id and a scope list. That is deliberate: a tool cannot be
called for the wrong Viewer, and cannot forget the Scope check, because neither is a parameter it
could get wrong. The check runs before the gateway is touched.

Lives in [`src/lib/mcp/agent-session.ts`](src/lib/mcp/agent-session.ts).

## Scope

What an Agent Session is allowed to do: `profile:read` and `profile:write`. Read and write are
separate so a client that only needs to read never has to hold write.

OAuth carries granted scopes as one space-delimited string, both in the token claim and in the
authorize request the consent screen reads. `parseScopes` is the single parse rule for both, and it
returns nothing for anything that is not a string — an unparseable claim grants nothing rather than
throwing.

Lives in [`src/lib/mcp/mcp-scopes.ts`](src/lib/mcp/mcp-scopes.ts), which stays free of server config
so client components can import it.

## MCP Connection

An agent a Viewer has let act on their behalf. The durable record is the **consent** row, not any
token: it outlives every access token, so it is what the account page lists and what disconnecting
removes. Disconnecting also revokes the tokens already issued — an access token in flight stays
valid until it expires, the refresh token is what gets cut off.

A client that registered without a name is shown by its raw client id, so a connection is never
nameless.

Shapes and mapping live in [`src/lib/mcp/mcp-connection.ts`](src/lib/mcp/mcp-connection.ts);
disconnecting is an Account Action.

## Account Overview

Everything the account page needs about a Viewer beyond the Viewer itself: whether they have a
password, and their MCP Connections. One call, one shape, two independent reads that run together.

The reads sit behind `AccountRecordGateway`, which returns rows rather than answers — the shaping
rules stay in the module so the in-memory adapter can drive them.

Lives in [`src/lib/account/account-overview.ts`](src/lib/account/account-overview.ts).

## Conventions this model assumes

- UI copy is German. It is centralised per module (message catalogues, email templates) rather
  than inlined at call sites.
- Results cross seams as discriminated unions, never as thrown exceptions.
- Modules accept their dependencies; they do not construct them. `auth.ts` is the wiring point.
