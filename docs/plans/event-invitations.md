# Implementierungsplan: Event-Einladungen

> **Stand 2026-08-29: Phase 0–6 umgesetzt, inklusive Bild-Upload, danach ein UI-Durchgang**
> (Gästeliste mit Suche und Filtern, kompakte Event-Liste, Antwort-Balken statt Kachelwand,
> Details hinter einer Aufklappzeile, Ladezustände, aufgeräumter Formular-Baukasten). Der Bucket `invitation-images`
> liegt im Neon-Projekt `oni-009-a30`. Es fehlt nur noch ein Schritt, den nur ein Mensch tun kann:
> ein Branch-Credential mit `storage:read` + `storage:write` in der Neon-Konsole erzeugen und
> `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` in `.env` eintragen. Bis dahin meldet die App den
> Bildspeicher als nicht eingerichtet und funktioniert im Übrigen normal.

Ergebnis der Grilling-Session vom 2026-08-29. Das Vokabular steht in [CONTEXT.md](../../CONTEXT.md),
die beiden schwer umkehrbaren Entscheidungen in [ADR-0003](../adr/0003-events-belong-to-organizations.md)
und [ADR-0004](../adr/0004-guests-answer-through-an-unguessable-link.md).

Jede Phase ist für sich lauffähig und endet grün (`bun check`, `bun typecheck`, `bun test`).

---

## Phase 0 — Fundament

Nichts davon ist Feature-Arbeit, aber alles Weitere steht darauf.

1. **`date-fns` installieren.** AGENTS.md schreibt es vor, es fehlt. Alle Fristen-Vergleiche und
   Formatierungen laufen darüber, nichts über native `Date`-Mathematik.
2. **AGENTS.md präzisieren.** Der Passus „Server State: Use TanStack Query" gilt für
   client-seitiges Fetching. Events und Einladungen laden als RSC direkt aus Drizzle; ohne diese
   Klarstellung widerspricht die Regel dauerhaft dem Code.
3. **organization-Plugin verdrahten.** `organization()` aus `better-auth/plugins/organization` in
   `auth.ts`, `organizationClient()` im `auth-client.ts`. Tabellen `organization`, `member`,
   `invitation` ins Drizzle-Schema (generiert, nicht handgeschrieben — wie die OAuth-Tabellen),
   `session.activeOrganizationId` ergänzen. `teams` bleibt aus.
4. **Persönliche Organisation automatisch anlegen.** Das Plugin kennt keinen Auto-Create-Schalter
   (Optionen sind `allowUserToCreateOrganization`, `creatorRole`, `membershipLimit`, `schema`,
   `teams`) — also ein `databaseHooks.user.create.after` in `auth.ts`, das
   `auth.api.createOrganization` mit `creatorRole: 'owner'` aufruft. Name: der Anzeigename des
   Nutzers, sonst „Meine Events".
5. ~~Backfill-Migration~~ **entfällt.** `ensurePersonalOrganization` ist idempotent (Ids aus der
   User-Id abgeleitet, Insert mit `onConflictDoNothing`) und wird sowohl vom Registrierungs-Hook
   als auch von `getActiveMembership()` aufgerufen. Bestandsnutzer werden bei ihrem nächsten
   Request geheilt — eine zweite SQL-Migration daneben wäre dieselbe Logik ein zweites Mal.
6. **Aktive Organisation auflösen.** Ein `getActiveOrganization()` neben `getViewer()`, das die
   Organisation des Viewers liefert. Solange es keine Org-UI gibt, ist das schlicht die einzige
   Mitgliedschaft. Alle Event-Abfragen filtern darüber — nie über `userId`.

**Test:** Registrierung legt genau eine Organisation an; ein zweites Registrieren interferiert
nicht; der Backfill ist idempotent.

---

## Phase 1 — Schema

Eine Migration, sieben Tabellen. Namen im Schema tragen `event_`-Präfix, wo das
organization-Plugin bereits belegt hat.

- **`event`** — `id`, `organizationId`, `createdByUserId`, `title`, `greeting`, `location`,
  `startsAt`, `endsAt` (beide `timestamptz`, nullable), `responseDeadline` (nullable),
  `status` (`active` | `archived`), `createdAt`, `updatedAt`.
  Theme direkt am Event: `themeAccent`, `themeMode` (`light` | `dark`), `themeFont`,
  `themeHeaderImageKey`. Eigene Tabelle lohnt bei vier Spalten nicht.
- **`event_invitation`** — `id`, `eventId`, `token` (unique), `sentAt` (nullable),
  `responseDeadline` (nullable, überschreibt das Event), `note`, `createdAt`, `updatedAt`.
- **`event_guest`** — `id`, `invitationId`, `firstName`, `lastName`, `email` (nullable),
  `note` (nullable, nur intern), `ageGroup` (`adult` | `child`), `isMainGuest`, `position`,
  `response` (`open` | `accepted` | `declined`), `respondedAt`, `updatedAt`.
- **`event_form_field`** — `id`, `eventId`, `type` (`text` | `textarea` | `select` | `radio` |
  `checkbox`), `label`, `helpText`, `scope` (`guest` | `invitation`), `onlyWhenAttending`,
  `required`, `options` (jsonb: Liste aus `{ id, label }`), `position`, `retiredAt` (nullable),
  `createdAt`.
- **`event_answer`** — `id`, `fieldId`, `guestId` (nullable), `invitationId` (nullable), `value`
  (jsonb, weil Checkbox mehrere Werte hält), `updatedAt`. Genau eine der beiden Zielspalten ist
  gesetzt — per Check-Constraint erzwungen, passend zum `scope` des Feldes. Unique über
  (`fieldId`, `guestId`) bzw. (`fieldId`, `invitationId`).
- **`event_response_log`** — `id`, `invitationId`, `guestId` (nullable), `fieldId` (nullable),
  `kind` (`response` | `answer`), `previousValue`, `nextValue`, `actor` (`guest` | `admin`),
  `createdAt`. Kaskadiert mit dem Gast: Gast löschen löscht Antworten und Log.

Indizes: `event.organizationId`, `event_invitation.eventId`, `event_invitation.token` (unique),
`event_guest.invitationId`, `event_form_field.eventId`, `event_answer.fieldId`,
`event_response_log.invitationId`.

Alle Zeitstempel `timestamptz`, gespeichert in UTC.

---

## Phase 2 — Domänen-Kern

Server-seitig, ohne React, mit `bun test` abgedeckt. Klassen nach AGENTS.md, Ergebnisse als
Discriminated Unions.

- **`src/lib/events/event-access.ts`** — `EventAccess.forManaging` und `.forDeleting`: löst
  `(membership, eventId)` zu einem Event der Organisation auf oder liefert
  `{ success: false, error: 'not-found' }`. Kein Unterschied zwischen „gibt es nicht" und „gehört
  jemand anderem". `forDeleting` prüft zusätzlich `role ∈ { owner, admin }`. Die Organisation steckt
  **in der Abfrage**, nicht in einer Prüfung danach.
- **`src/lib/events/invitation-token.ts`** — 128 Bit aus `crypto.getRandomValues`, base64url,
  ohne Bindestriche. Erzeugen und Rotieren an einer Stelle.
- **`src/lib/events/response-window.ts`** — die reine Frist-Logik:
  `isResponseOpen({ eventStatus, eventDeadline, invitationDeadline }, now)`. Einladungsfrist
  schlägt Eventfrist; `archived` schließt immer. Diese Funktion ist die einzige Wahrheit darüber,
  ob ein Gast noch schreiben darf, und wird auch serverseitig vor jedem Schreibzugriff geprüft —
  nicht nur zum Ausblenden von Buttons.
- **`src/lib/events/form-schema.ts`** — baut aus den Felddefinitionen ein Zod-Schema für genau eine
  Einladung: pro Gast dessen sichtbare Felder (abhängig von `onlyWhenAttending` und dem gewählten
  Status), dazu die Einladungs-Felder. Pflicht gilt nur für sichtbare Felder zusagender Gäste.
  Dieselbe Funktion validiert Client- und Serverseite.
- **`src/lib/events/guest-list-parser.ts`** — die Massenanlage: eine Zeile = eine Einladung, Namen
  per Komma, erste Person ist Hauptgast. Liefert eine Vorschau-Struktur plus Zeilenfehler, legt
  selbst nichts an.
- **`src/lib/events/response-plan.ts`** — rein: vergleicht den aktuellen Stand mit der Einsendung
  und liefert, was sich ändert (Status, Antworten schreiben/löschen, Log-Einträge). Nur echte
  Änderungen; eine umsortierte Checkbox-Liste ist keine.
- **`src/lib/events/response-service.ts`** — prüft das Antwortfenster erneut, plant und schreibt.
  Die Frist bindet **Gäste**: wer über den Link antwortet, kommt nach Ablauf nicht mehr durch. Der
  Gastgeber ist davon nicht betroffen — er antwortet nicht über einen Link und darf sein eigenes
  Event weiter korrigieren.
  **Achtung:** der neon-http-Treiber kennt keine Transaktionen (`db.transaction` wirft), nur
  `db.batch()` — ein nicht-interaktiver Transaktionsblock. Der Service liest deshalb zuerst, rechnet
  die Deltas im Speicher aus und schickt danach alle Schreibvorgänge als *einen* Batch. Wo das
  nicht reicht, wäre der Wechsel auf den WebSocket-Treiber nötig; bisher reicht es.
- **`src/lib/events/rate-limiter.ts`** — eigenes IP-Limit für die öffentliche Route, getrennt für
  Token-Auflösung und Absenden. Eigene Tabelle mit Fensterzähler; better-auths `rate_limit`
  gehört dem Auth-Plugin und wird nicht mitbenutzt.

Dazu die Drizzle-Adapter `drizzle-event-lookup.ts`, `drizzle-response-store.ts` (ein Batch pro
Plan) und `drizzle-rate-limit-store.ts` (Zählen und Fenster-Reset in *einem* Upsert-Statement).

**Test:** Frist-Logik inkl. Überschreibung und Archiv; Schema-Bau für alle fünf Feldtypen und beide
Scopes; Pflichtfeld gilt nicht für Absager; Parser mit krummen Zeilen; Log schreibt nur Deltas.

---

## Phase 3 — Admin-Oberfläche

**Route-Registry zuerst** (`src/config/routes.ts`): `HOME` (`/`) wird die Event-Liste,
`EVENT_DETAIL` (`/events`) als `viewer`, `INVITATION` (`/i`) als `public`. Die vorhandene
Prefix-Logik von `matchesRoute` deckt die dynamischen Segmente ab; `HOME` bleibt exakt.
`navigation.config.ts` bekommt das passende Icon, das Label wird „Events".

Seiten (alle RSC, Mutationen als Server Actions mit `revalidatePath`):

- `/` — Event-Liste (aktiv/archiviert getrennt), Anlegen-Dialog.
- `/events/[eventId]` — Übersicht: Zahlenleiste (zugesagt / abgesagt / offen / nicht versendet),
  Frist, nächste Schritte.
- `/events/[eventId]/guests` — die Arbeitsfläche: eine Zeile pro Einladung mit den Namen ihrer
  Personen, deren Status in der Farbe des Namens steckt; darüber Suche (Name, E-Mail, interne
  Notiz) und Filter nach Antwort und Versand. Alles Seltene — Link ersetzen, eigene Frist, Person
  ergänzen oder entfernen, Einladung löschen — liegt hinter einer Aufklappzeile, damit der
  Alltagsblick eine Namensliste bleibt. Die Filterregeln sind rein und getestet
  (`guest-filters.ts`).
- `/events/[eventId]/form` — Formular-Baukasten: Felder anlegen, sortieren, Typ, Optionen, Scope,
  „nur bei Zusage", Pflicht, Feld zurückziehen (soft).
- `/events/[eventId]/design` — Akzentfarbe, Hell/Dunkel, Schrift, Header-Bild, mit Live-Vorschau
  der echten Gästeseite (dieselbe Render-Komponente, nicht nachgebaut).
- `/events/[eventId]/settings` — Titel, Zeiten, Ort, Begrüßung, Frist, archivieren, löschen
  (Bestätigung durch Eintippen des Titels; nur owner/admin).

**CSV-Export** als Route Handler unter `/events/[eventId]/export`, auth- und
organisationsgeprüft: eine Zeile pro Gast, Spalten für Stammdaten, Status, alle Felder inklusive
der zurückgezogenen.

**Header-Bild:** Upload in den privaten Neon-Bucket `invitation-images`. Der Design-Tab nimmt eine
Datei entgegen (JPEG, PNG, WebP, AVIF, GIF, bis 5 MB), speichert sie sofort — eine Datei ist kein
Entwurfswert, der auf einen Speichern-Knopf wartet — und legt sie unter
`events/<eventId>/header-<uuid>.<ext>` ab. Weil der Bucket privat ist, erreicht das Bild den
Browser als **signierte URL mit einer Stunde Gültigkeit**, serverseitig pro Request erzeugt; eine
kopierte Bild-URL ist damit kein dauerhafter Freibrief. Das alte Objekt wird erst nach dem
erfolgreichen Upload des neuen gelöscht. Die Spalte `theme_header_image_key` trägt weiterhin auch
eine eingetippte URL, damit vorher eingetragene Bilder nicht kaputtgehen.

Der Speicher ist **optional konfiguriert**: fehlen die Zugangsdaten, läuft die App normal weiter und
das Upload-Feld erklärt sich selbst. Alle fünf Variablen gelten nur gemeinsam — ein halb
konfigurierter Bucket würde erst im ungünstigsten Moment auffallen.

**shadcn-Komponenten** über die CLI nachziehen: `table`, `input`, `select`, `checkbox`,
`radio-group`, `tabs`, `dialog`, `badge`, `switch`, `label`, `tooltip`.

---

## Phase 4 — Gästeseite

- `/i/[token]` — öffentlich, `params` ist ein Promise (Next 16). Kein Layout des App-Shells, kein
  Account-Control; eigenes Layout, das die Theme-Werte des Events als CSS-Variablen setzt. Der
  Akzent bekommt eine berechnete Vordergrundfarbe, damit Text auf jeder gewählten Farbe lesbar
  bleibt — DESIGN.md-Kontrastregeln gelten auch hier.
- `robots: { index: false, follow: false }` über `generateMetadata`, sonst landet ein Token in
  einer Suchergebnisliste.
- Zustände, alle über dieselbe Seite:
  **offen** (antworten und ändern), **geschlossen** (Frist vorbei oder Event archiviert: eigene
  Antwort lesbar, Hinweis plus Verweis auf den Gastgeber), **nicht verfügbar** (unbekannter,
  rotierter Token oder gelöschtes Event — eine neutrale Seite für alle drei Fälle, ohne
  Unterscheidung).
- Ablauf: pro Gast Zusage/Absage, darunter dessen sichtbare Felder, am Ende die
  Einladungs-Felder. Nach dem Speichern eine Zusammenfassung mit „zuletzt geändert am …" und der
  Angabe, bis wann noch geändert werden kann.
- Absenden über Server Action: Rate-Limit, Token auflösen, Frist serverseitig prüfen, Zod gegen das
  aus den Feldern gebaute Schema, dann Transaktion plus Log.
- `data-testid` auf allen Statusschaltern, Feldern und Zustandsbannern.

---

## Phase 5 — MCP

Scopes `events:read` und `events:write` in `mcp-scopes.ts`, Tools in `mcp-tools.ts`, jeweils gegen
dieselben Service-Klassen wie die UI.

Erlaubt: Events auflisten und lesen, Event anlegen und bearbeiten, Einladungen und Gäste anlegen und
bearbeiten, Formularfelder pflegen, „versendet" markieren, Antwortstand abfragen.

Ausgeschlossen — und im Tool-Schema gar nicht erst vorhanden: löschen, archivieren, Token neu
erzeugen, Antworten im Namen eines Gastes ändern.

---

## Phase 6 — Abschluss

`bun check`, `bun typecheck`, `bun test`. DESIGN.md um den Abschnitt zur Gästeseite ergänzen
(Theme-Variablen, Kontrastregel für die Akzentfarbe). CONTEXT.md ist bereits gepflegt.

---

## Getroffene Detailentscheidungen

Nicht in der Session gefragt, weil reversibel — hier aber sichtbar, falls sie stören:

- Theme als vier Spalten am Event statt eigener Tabelle.
- CSV-Export als Route Handler statt Server Action (Server Actions liefern keinen Datei-Download).
- Rate-Limit in eigener Tabelle, nicht in der von better-auth.
- Gleichzeitige Änderungen über denselben Link: letzter Schreibvorgang gewinnt, keine Sperre.
- Antwortwerte als jsonb, weil Checkbox-Felder mehrere Werte halten.
- Ids der persönlichen Organisation deterministisch aus der User-Id (`personal-org-<userId>`), damit
  zwei gleichzeitige Requests dieselbe Zeile schreiben statt zweier Organisationen.
- Organisationen können weder über die API angelegt (`allowUserToCreateOrganization: false`) noch
  gelöscht werden (`disableOrganizationDeletion: true`), solange es keine Org-UI gibt — ein Löschen
  würde alle Events der Organisation mitnehmen.
