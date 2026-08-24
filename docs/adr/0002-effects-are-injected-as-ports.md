# ADR-0002: Effects are injected as ports, not returned as data

- **Status**: accepted
- **Date**: 2026-08-24

## Context

Every account action ends in side effects: a toast, sometimes a redirect and a router refresh,
sometimes a list refetch. Before this change those effects were written inline in each of eight
call sites, along with the error handling that decided between them.

Collapsing that into one module forced a choice about where the effects go.

The obvious option was a pure core: `AccountActions` returns a description of what should happen
(`{ ok: false, toast: '…' }`), and the React hook interprets it. Pure functions, trivial tests, no
ports to inject.

We rejected it. That shape had already failed once in this codebase. `AuthErrorHelper` was pure and
perfectly testable, and it was never the source of a bug. The bugs lived in how it was *called*:
the fallback string retyped differently for the returned error and the thrown one, a missing
`return` after an error toast, a `router.refresh()` present in one sign-out and absent from the
other. A pure core would have moved the interpretation into the hook and left exactly those
mistakes untested — the tests would prove the description was right while the code that acted on it
stayed unexercised.

## Decision

Modules that perform effects keep performing them, and accept the effect-performing collaborators
as ports.

`AccountActions` takes `{ notify, navigate, invalidate }`. It calls them. Tests pass spies and
assert on what was called; production passes `sonner`, the Next router, and a refetch.

Ports are required, not optional. Where a caller has nothing to do — most actions do not need
invalidation — the hook supplies a no-op adapter. A no-op is a legitimate adapter; an optional port
is a second code path.

The same rule produced `AuthGateway` and `EmailGateway`.

## Consequences

- The code under test is the code that runs. Redirect targets, refresh calls and toast copy are all
  asserted through the module's own interface.
- Testing needs no DOM, no React renderer, and no new dependencies. `bun test` runs against plain
  objects.
- Constructing `AccountActions` requires three ports, which is more ceremony than a pure function.
  `useAccountActions` absorbs it so no component sees it.
- Actions return an outcome *as well as* firing effects. The outcome exists for callers that must
  branch — resetting a form only on success — and is explicitly not the mechanism by which the
  effects happen.

## Alternatives considered

**Pure core returning an effect description.** Rejected above: it relocates the untested surface
rather than removing it.

**Let the module import `toast` and `useRouter` directly.** No injection ceremony, but nothing can
be tested without mocking module imports, and the module would only be callable from React.
