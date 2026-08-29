# ADR-0003: Events belong to Organizations, created automatically and kept invisible

- **Status**: accepted
- **Date**: 2026-08-29

## Context

Events and their guest lists need an owner. The obvious owner is the Viewer who created the Event:
one `ownerId`, one comparison at every access, nothing new in the schema.

But co-hosting is the normal case for the thing this app is for. Two people plan a wedding; an
office party has a deputy. Retrofitting shared ownership later means touching every query, every
authorization check, and migrating live guest lists — the kind of change that is cheap now and
expensive once real Events exist.

better-auth ships an organization plugin that already models membership, roles and invitations. It
is in the dependency tree; it is simply not wired up.

## Decision

Every Event belongs to an Organization, never directly to a user. A personal Organization is created
automatically when someone registers, and existing users get one through a backfill migration.

The Organization has **no UI**. There is no switcher, no member list, no role screen. For everyone
today the app looks single-user; the Organization is a seam, not a feature.

Authorization is written as if members already existed: any member may create and manage the
Organization's Events, while deleting one is reserved for `owner` and `admin`. Deletion is the only
irreversible action in the app, so it is the only one gated by role.

## Consequences

- Turning on collaboration later is enabling screens, not migrating data.
- Every Event query filters by Organization, not by user. A missing filter is a cross-tenant leak,
  which makes the Event repository the one place that must never be bypassed.
- Roles are enforced before anything can exercise them, so the rule is untested against real
  multi-member use until the UI lands.
- The plugin brings a table named `invitation` for membership invites, which collides with this
  app's central concept. Ours is therefore `event_invitation` in the schema, while the domain
  language keeps calling it an Invitation (see CONTEXT.md).
