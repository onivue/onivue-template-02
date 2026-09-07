# ADR-0003: Busy state is a port, and the hook returns the module

- **Status**: accepted
- **Date**: 2026-08-27

## Context

ADR-0002 moved every account effect behind a port: `notify`, `navigate`, `invalidate`. One effect
did not make the move. Busy state stayed in `useAccountActions`, which wrapped each action in a
local `run(name, targetId, operation)` helper that set `{ status: 'busy' }` before and
`{ status: 'idle' }` after.

That left the hook re-declaring the module's whole interface. Fourteen methods, each one restating
a signature that already existed on `AccountActions`, purely so the wrapper could be applied. 99
lines whose only content was the list of action names, written a second time. Adding an action
meant editing five places: the name union, the message catalogue, the effect table, the class, and
the hook.

It also left the one effect ADR-0002 cared most about untestable. The tests could assert every
toast, redirect and refresh, but not that busy was raised before the work started and cleared after
the effects finished — the exact ordering a double-submit depends on.

## Decision

Busy is a fourth port. `AccountActions` takes `{ busy, invalidate, navigate, notify }`, and
`execute` bookends the ritual with `busy.start(action, targetId)` and, in a `finally`,
`busy.finish()`.

`useAccountActions` no longer re-declares the actions. It builds the four adapters and returns the
module itself:

```ts
const { actions, isBusy, isRunning } = useAccountActions();
```

Components call `actions.addPasskey(name)` — the module's own method, not a copy of it.

`targetId` moves into the module too, declared where the action is defined rather than at each call
site: `deletePasskey` reports the passkey id, `revokeConnection` the consent id. `isRunning` still
answers per row.

## Consequences

- Adding an action edits three places instead of five, and none of them is a passthrough.
- Busy transitions are asserted through the module's own interface, including that the redirect
  fires while still busy.
- The hook's interface is three members instead of seventeen.
- Call sites destructure rather than reaching through one object, which is a visible change at
  every one of them. That is a one-time cost and the reason it is recorded here.
- `AccountActions` is constructed fresh on every render, as before. It holds no state — the state
  lives in the hook's `useState`, which the busy adapter writes to.

## Alternatives considered

**Keep the wrapper, generate it with a `Proxy`.** Deletes the restatement without moving busy into
the module, but loses the per-action argument types that are the only thing the hand-written list
was buying. Worse on both counts.

**Return `{ ...actions }` so call sites keep their current shape.** Spreading a class instance drops
the method bindings, and re-binding each one is the passthrough again under another name.

**Leave busy in the hook.** The status quo. Rejected for the same reason ADR-0002 rejected a pure
core: it keeps an effect outside the seam, where the tests cannot see it.
