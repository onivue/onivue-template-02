# ADR-0004: Guests answer through an unguessable link, with no account

- **Status**: accepted
- **Date**: 2026-08-29

## Context

The app deliberately does not send invitations. It generates links that hosts distribute however
they like — WhatsApp, email, printed on a card. Whoever opens one must be able to accept or decline
for their household, come back later, see what they answered, and change it.

Every identity mechanism we have is a poor fit for that. An account is an absurd hurdle for a
grandmother replying to a birthday invitation; a magic link needs an email address the host often
does not have; a per-guest code has to be communicated separately through the same untrusted channel
as the link itself, so it protects little and costs replies.

## Decision

Each Invitation carries a random token of roughly 128 bits, reachable at a public route. Possession
of the link *is* the authorization: no session, no code, no email. The same link serves every Guest
on that Invitation, so any of them can answer for the others — which mirrors how a household
actually replies.

Two things make that defensible. The host can replace an Invitation's token, which invalidates the
old link while keeping the answers, and is the remedy when a link is forwarded somewhere it should
not have gone. And a link that does not resolve — unknown token, replaced token, deleted Event —
returns one neutral page for all of those cases, so nobody can probe for which Invitations exist.

## Consequences

- A forwarded link is a granted permission. Nothing on the guest page may show more than that
  household's own data.
- The route is public, unauthenticated, and writes to the database, so it carries its own IP rate
  limit on both token resolution and submission. better-auth's rate limiter covers only its own
  endpoints and does not apply here.
- Guest pages must be excluded from indexing, or a token ends up in a search result.
- Because there is no identity, an answer cannot be attributed to a person beyond the Guest row it
  was recorded against. The Response Log records *whether* a change came from the link or from the
  host, and nothing finer.
