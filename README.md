# onivue

## Getting Started

First, run the development server:

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## MCP App

Der MCP-Server liefert seine Ergebnisse nicht nur als Text, sondern als **MCP App** nach
[SEP-1865](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)
(Extension `io.modelcontextprotocol/ui`, Spec `2026-01-26`). Ruft ein Host `list_events` auf, rendert
er das Ergebnis als interaktive Oberfläche direkt im Chat: die Events, die Einladungen des
ausgewählten Events samt Antwortstand, und das Löschen einer Einladung nach Rückfrage.

Die Oberfläche greift nie selbst auf Datenbank oder API zu. Jeder Klick wird zu einem `tools/call`
über den Host — dieselben Tools, die auch das Modell benutzt, mit denselben Scopes und derselben
Zustimmung.

| Teil                                              | Zweck                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| `src/features/mcp-app/app-contract.ts`            | Resource-URI, Tool-Namen und die Zod-Schemas beider Seiten.          |
| `src/features/mcp-app/mcp-app-resource.ts`        | Registriert die `ui://`-Resource am Server.                          |
| `src/features/mcp-app/view/`                      | Die Oberfläche selbst (React, Tailwind, Design-System der App).      |
| `src/features/mcp-app/generated/mcp-app.json`     | Das gebaute, self-contained HTML — erzeugt, nicht von Hand geändert. |
| `scripts/build-mcp-app.ts`                        | Der Build, der aus `view/` dieses eine HTML-Dokument macht.          |

### Lokal testen

```bash
bun install
bun dev          # baut die App mit (bun run mcp:app) und startet den Server auf :3000
```

Die App wird bei jedem `bun dev` und `bun build` neu gebaut. Nach einer Änderung in `view/` genügt:

```bash
bun run mcp:app
```

Danach den Host die Verbindung neu aufbauen lassen — Hosts cachen die `ui://`-Resource pro
Verbindung.

**Claude Code** spricht Streamable HTTP direkt und braucht keine Brücke:

```bash
claude mcp add --transport http onivue http://localhost:3000/api/mcp
```

**Clients, die nur stdio können** (z. B. Claude Desktop mit lokaler Konfigurationsdatei), gehen über
`mcp-remote`, das stdio auf den HTTP-Endpoint übersetzt und den OAuth-Flow im Browser öffnet:

```json
{
	"mcpServers": {
		"onivue": {
			"command": "npx",
			"args": ["-y", "mcp-remote", "http://localhost:3000/api/mcp"]
		}
	}
}
```

Die Datei liegt je nach Client woanders — für Claude Desktop unter
`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) bzw.
`%APPDATA%\Claude\claude_desktop_config.json` (Windows); für Claude Code in `~/.claude.json` oder
`.mcp.json`. Nach dem Eintrag den Client neu starten, dann `list_events` aufrufen.

Zum reinen Prüfen von Resource und Metadaten reicht der Inspector:

```bash
npx @modelcontextprotocol/inspector
```

Transport **Streamable HTTP**, URL `http://localhost:3000/api/mcp`. Unter _Resources_ steht
`ui://onivue/events` mit MIME-Type `text/html;profile=mcp-app`, unter _Tools_ trägt `list_events`
das `_meta.ui.resourceUri` darauf. Der Inspector rendert die App nicht — dafür braucht es einen Host
mit MCP-Apps-Unterstützung.

### Ein weiteres Tool mit UI

1. **Daten in den Vertrag aufnehmen.** In `src/features/mcp-app/app-contract.ts` ein Zod-Schema für
   die Nutzlast ergänzen und den Tool-Namen in `MCP_APP_TOOLS` eintragen. Die Oberfläche prüft jede
   Antwort gegen dieses Schema, statt der Form zu vertrauen, die sie bekommt.
2. **Tool registrieren.** Bleibt es dieselbe App, reicht der bestehende Tool-Aufruf — ein Tool ist
   aus der App heraus aufrufbar, solange seine `_meta.ui.visibility` `"app"` enthält (der Default).
   Soll das Tool eine **eigene** App rendern, in `mcp-app-resource.ts` eine zweite Resource unter
   einer eigenen `ui://`-URI registrieren und das Tool mit `registerAppTool` samt
   `_meta: { ui: { resourceUri: … } }` anmelden statt mit `server.registerTool`.
   Nur für die Oberfläche gedachte Tools bekommen `visibility: ['app']` und tauchen damit gar nicht
   erst in der Werkzeugliste des Modells auf.
3. **Text-Fallback behalten.** Das Ergebnis muss weiterhin `content` **und** `structuredContent`
   tragen (`toolSuccess` in `src/lib/mcp/mcp-result.ts` tut das). Ein Host ohne App-Unterstützung
   liest dann einfach den Text, das Tool funktioniert unverändert.
4. **Ansicht bauen.** Die Komponente unter `src/features/mcp-app/view/` ablegen und Daten über
   `callTool(...)` aus `view/tool-call.ts` holen. Neue Dateien in diesem Ordner werden von Tailwind
   automatisch gescannt; liegt eine verwendete Komponente außerhalb, in `view/view.css` eine
   `@source`-Zeile ergänzen, sonst fehlen ihre Klassen im Bundle.
5. **Bauen und prüfen.** `bun run mcp:app && bun check && bun typecheck`. Das erzeugte
   `generated/mcp-app.json` gehört mit in den Commit — es wird zur Laufzeit importiert, damit weder
   `next build` noch `tsc` einen zusätzlichen Schritt brauchen.

Alles Weitere zum Server selbst — Scopes, OAuth-Flow, Tool-Tabelle — steht in
[`src/lib/mcp/README.md`](src/lib/mcp/README.md).
