# ADR-0001: Derived values live in config, not in single-caller helper classes

- **Status**: accepted
- **Date**: 2026-08-24

## Context

`AGENTS.md` says: "Encapsulate all services, tools, and calculations in classes (e.g. `class
APIService`, `class DateHelper`)."

Applied literally to derivations, that rule produced `AuthUrlHelper` and `AuthIdentityHelper`: two
classes, five methods between them, one caller each.

`AuthUrlHelper` was the clearer case. Both its methods derived from the same value,
`APP_CONFIG.auth.baseUrl`, and both were called only from `auth.ts` — which passed that value back
in on every call, and called `getOrigin(baseUrl)` twice with the same argument. The class knew
nothing the caller didn't already know.

The stated reason for extracting them was testability. No test existed. And the risk worth testing
was never inside the helpers: `getOrigin` is one line of `new URL()`. The risk is a wrong relying
party id or an untrusted origin reaching production, which lives in how `auth.ts` composes them —
untested either way.

## Decision

Values derived from configuration are computed once in `config.ts`, next to the Zod schema that
validates their inputs, and exposed as fields on `APP_CONFIG`.

Where the derivation carries a rule worth testing, it is an exported pure function
(`deriveAuthUrls`), not a class. It stays exported specifically because `APP_CONFIG` throws at
import time when env is missing, which would otherwise make the rule untestable.

`AGENTS.md`'s class rule continues to apply to services and stateful collaborators — `AccountActions`,
`ResendGateway`, `AuthErrorHelper` are all classes. It does not apply to single-caller derivations.

## Consequences

- `AuthUrlHelper` and `AuthIdentityHelper` are deleted. `getDefaultName` moved into
  `AccountActions.register()`, its only real caller.
- `auth.ts` reads `APP_CONFIG.auth.origin` and `.passkeyRpId` as values.
- The loopback-to-`localhost` rule that WebAuthn requires is now covered by tests.
- The rule is narrower than "encapsulate calculations in classes", so a future reviewer will find
  functions where the convention implies classes. That is intentional; this ADR is why.

## Alternatives considered

**Keep the classes and add tests.** Would have tested `new URL().origin` — the framework, not our
rule — while leaving the composition in `auth.ts` uncovered.

**Inline the derivations at the call site.** Removes the classes but loses the one rule worth
keeping (loopback → `localhost`) and recomputes per call.
