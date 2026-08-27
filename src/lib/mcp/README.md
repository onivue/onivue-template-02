# MCP-Server

Lässt KI-Agenten (Claude Code, Claude Desktop, Cursor, ...) sich **als der angemeldete Nutzer**
mit dieser App verbinden und sein Profil bearbeiten. Der Agent bekommt kein eigenes Passwort und
keinen Cookie — er holt sich selbst ein OAuth-2.1-Access-Token über
[Authorization Code + PKCE](https://datatracker.ietf.org/doc/html/rfc7636), nachdem du im Browser
zugestimmt hast.

Diese App ist dafür ein vollwertiger **Authorization Server**: `@better-auth/mcp` (aufbauend auf
`@better-auth/oauth-provider`) stellt Discovery-Metadaten, Client-Registrierung, Consent und
Token-Ausgabe bereit. Es muss **nichts mehr manuell kopiert** werden.

## Was der Server kann

Endpoint: `POST /api/mcp` (Streamable HTTP, [Model Context Protocol](https://modelcontextprotocol.io)).

Zwei Tools, MVP-Umfang:

| Tool             | Macht                                                                       | Benötigter Scope |
| ---------------- | --------------------------------------------------------------------------- | ---------------- |
| `get_profile`    | Liest E-Mail, Vorname, Nachname und Benutzername des angemeldeten Nutzers.  | `profile:read`   |
| `update_profile` | Ändert Vorname, Nachname und/oder Benutzername. Nur gesetzte Felder ändern. | `profile:write`  |

Beide Tools schreiben über `internalAdapter.updateUser` und laufen damit durch **exakt dieselben**
`databaseHooks` wie die Account-Seite im Browser: Länge, Zeichen, Schimpfwortfilter und
Verfügbarkeit des Benutzernamens (`username`-Plugin) sowie die Vor-/Nachnamen-Prüfung aus
`auth.ts`. Es gibt keinen zweiten, laxeren Validierungspfad.

## Wie man sich verbindet

Einen MCP-Client auf `http://localhost:3000/api/mcp` zeigen lassen — z. B.:

```
claude mcp add --transport http onivue http://localhost:3000/api/mcp
```

Beim ersten Aufruf passiert alles Weitere von selbst:

1. Der Server antwortet mit `401` und einem `WWW-Authenticate`-Header, der auf die
   Protected-Resource-Metadaten zeigt (RFC 9728).
2. Der Client liest daraus den Authorization Server, registriert sich dort selbst
   (Dynamic Client Registration, RFC 7591) und öffnet den Browser.
3. Du meldest dich an (falls nötig) und bestätigst auf `/consent`, welche Scopes der Client
   bekommen soll.
4. Der Client tauscht den Authorization Code per PKCE gegen ein Access Token — und ist verbunden.

Das Token ist ein signiertes JWT, das an die Resource `…/api/mcp` gebunden ist (`aud`) und die
zugestimmten Scopes im `scope`-Claim trägt.

### Claude Code

Am einfachsten über die CLI:

```bash
# nur für dieses Projekt (Standard)
claude mcp add --transport http onivue http://localhost:3000/api/mcp

# für alle deine Projekte
claude mcp add --transport http --scope user onivue http://localhost:3000/api/mcp

# im Repo geteilt (legt .mcp.json an, wird eingecheckt)
claude mcp add --transport http --scope project onivue http://localhost:3000/api/mcp
```

Manuell eintragen geht genauso. Wohin, hängt vom gewünschten Geltungsbereich ab:

| Geltungsbereich  | Datei                                   | Gilt für           |
| ---------------- | --------------------------------------- | ------------------ |
| Local (Standard) | `~/.claude.json` unter dem Projektpfad  | nur dieses Projekt |
| User             | `~/.claude.json` auf oberster Ebene     | alle Projekte      |
| Project          | `.mcp.json` im Projektwurzelverzeichnis | geteilt via Git    |

**User-Scope** — in `~/.claude.json` auf oberster Ebene:

```json
{
	"mcpServers": {
		"onivue": {
			"type": "http",
			"url": "http://localhost:3000/api/mcp"
		}
	}
}
```

**Local-Scope** — in `~/.claude.json` verschachtelt unter dem Projektpfad:

```json
{
	"projects": {
		"/Users/dein-name/Documents/onivue/onivue-template-02": {
			"mcpServers": {
				"onivue": {
					"type": "http",
					"url": "http://localhost:3000/api/mcp"
				}
			}
		}
	}
}
```

**Project-Scope** — `.mcp.json` im Wurzelverzeichnis, gleiche Struktur wie das User-Beispiel oben.

> `"type": "http"` ist Pflicht. Fehlt es bei gesetzter `url`, interpretiert Claude Code den Eintrag
> als stdio-Server und die Verbindung schlägt fehl. Ein `headers`-Feld brauchst du **nicht** — den
> Token holt sich der Client über OAuth.

Danach in Claude Code `/mcp` öffnen: Der Server steht dort zunächst auf `! Needs authentication`.
Ein Klick startet den Browser-Flow (Login → `/consent` → fertig). Alternativ auf der Kommandozeile:

```bash
claude mcp login onivue     # startet den OAuth-Flow
claude mcp logout onivue    # löscht die Zugangsdaten lokal wieder
```

### Claude Desktop

Wichtig: `claude_desktop_config.json` ist **nur für lokale stdio-Server** (`command`/`args`
gedacht). Ein Remote-HTTP-Server wie dieser wird dort **nicht** eingetragen, sondern über die
Oberfläche als _Custom Connector_ hinzugefügt:

1. Einstellungen öffnen — `Strg`/`Cmd` + `,`, oder Menü-Icon oben links → **File** → **Settings**.
2. In der Seitenleiste **Connectors** wählen.
3. Oben rechts **Add** → **Add custom connector**.
4. Als URL `http://localhost:3000/api/mcp` eintragen und **Add** klicken.
5. Dem Authentifizierungs-Dialog folgen — er führt durch denselben OAuth-Flow wie oben.

Welche Tools der Connector nutzen darf, lässt sich danach unter Connectors → _onivue_ einzeln
freigeben.

> **Einschränkung bei lokaler Entwicklung:** Custom Connectors erwarten in der Regel eine
> öffentlich erreichbare `https://`-URL. Ein `http://localhost`-Server wird von Claude Desktop
> möglicherweise abgelehnt. Für lokales Testen ist Claude Code der verlässliche Weg; für Claude
> Desktop entweder gegen die deployte Instanz verbinden oder einen HTTPS-Tunnel davorschalten
> (`BETTER_AUTH_URL` muss dann auf dieselbe öffentliche URL zeigen, damit Resource und Issuer in
> den Metadaten stimmen).

Der Vollständigkeit halber — so sieht die Desktop-Konfigurationsdatei aus und wo sie liegt, falls
du dort einmal einen _lokalen_ Server ergänzen willst:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Zu finden auch über Einstellungen → **Developer** → **Edit Config**. Nach Änderungen muss Claude
Desktop vollständig beendet und neu gestartet werden. MCP-Logs liegen unter
`~/Library/Logs/Claude` (macOS) bzw. `%APPDATA%\Claude\logs` (Windows).

### Discovery-Endpunkte

| Zweck                                    | Pfad                                                         |
| ---------------------------------------- | ------------------------------------------------------------ |
| Protected Resource Metadata (RFC 9728)   | `/.well-known/oauth-protected-resource/api/mcp`              |
| Authorization Server Metadata (RFC 8414) | `/.well-known/oauth-authorization-server` (auch `/api/auth`) |
| Client-Registrierung (RFC 7591)          | `/api/auth/oauth2/register`                                  |
| Authorization / Token                    | `/api/auth/oauth2/authorize` · `/api/auth/oauth2/token`      |

Die beiden `.well-known`-Routen unter `src/app/` sind dünne Weiterleitungen: better-auth hängt
unter `/api/auth`, die Specs verlangen die Metadaten aber im Root.

**Hinweis für native Clients:** CLI-Clients müssen sich mit `"application_type": "native"`
registrieren, sonst lehnt der Provider `http://127.0.0.1:…`-Redirect-URIs korrekterweise ab
(Web-Clients brauchen HTTPS).

### MCP Inspector (zum Debuggen)

```
npx @modelcontextprotocol/inspector
```

Transport **Streamable HTTP**, URL `http://localhost:3000/api/mcp`. Der Inspector durchläuft den
OAuth-Flow selbstständig.

## Aufbau

| Datei                        | Zweck                                                                     |
| ---------------------------- | ------------------------------------------------------------------------- |
| `mcp-config.ts`              | Servername/-version, Tool-Namen, Scopes und deren Beschreibungen, URLs.   |
| `mcp-scopes.ts`              | Scope-Ids, Beschreibungen und `parseScopes` — die eine Parse-Regel.       |
| `mcp-tool-schema.ts`         | Zod-4-Schemas der Tool-Ein-/Ausgaben; validiert mit `profile-schema.ts`.  |
| `agent-session.ts`           | Eine authentifizierte Anfrage: Identität, Scope-Prüfung, Profil-Zugriff.  |
| `better-auth-mcp-gateway.ts` | Produktions-Adapter: übersetzt den Session-Port auf den internen Adapter. |
| `mcp-tools.ts`               | Registriert die Tools gegen eine `AgentSession`, übersetzt Ergebnisse.    |
| `mcp-handler.ts`             | `requireMcpAuth` → pro Request eine `AgentSession` → Tools.               |
| `mcp-connection.ts`          | Reine Formen und Mapping für verbundene Clients, ohne Datenbank.          |
| `mcp-client-lookup.ts`       | Liest Name/URI eines registrierten Clients für die Consent-Seite.         |
| `mcp-connection-actions.ts`  | Server Action: trennt einen Client und widerruft seine Tokens.            |

Dazu, außerhalb dieses Ordners:

| Datei                                      | Zweck                                         |
| ------------------------------------------ | --------------------------------------------- |
| `src/app/api/mcp/route.ts`                 | Route-Handler des MCP-Endpoints.              |
| `src/app/(mcp)/consent/page.tsx`           | Zustimmungsseite (Server-Teil).               |
| `src/app/.well-known/…`                    | Discovery-Weiterleitungen auf den Root-Pfad.  |
| `src/components/mcp/consent-form.tsx`      | Zustimmungsformular.                          |
| `src/components/mcp/connected-clients.tsx` | Verbundene Clients auf der Account-Seite.     |
| `src/lib/account/account-overview.ts`      | Liest die Zustimmungen für die Account-Seite. |

Die UI-Komponenten liegen gebündelt unter `src/components/mcp/`, die Seiten in der Route-Gruppe
`src/app/(mcp)/` — beides spiegelbildlich zu diesem `src/lib/mcp/`-Ordner. Route-Gruppen ändern die
URL nicht: `(mcp)/consent` bleibt `/consent`.

## Kein Device Flow

RFC 8628 ist bewusst **nicht** aktiv. Ein MCP-Client holt sich seinen Token über Authorization Code

- PKCE und braucht dafür nur einen Browser, den auf einem Entwickler-Rechner ohnehin jeder Client
  öffnen kann. Der Device Grant wäre zusätzliche, ungenutzte Oberfläche (eigenes Plugin, eigene
  Tabelle, eigene Bestätigungsseite) gewesen.

Falls doch einmal ein Client ohne Browser angebunden werden soll: `oauthDeviceAuthorization()` aus
`@better-auth/oauth-provider` in `auth.ts` ergänzen, die `deviceCode`-Tabelle ins Schema aufnehmen
— inklusive der Felder `resources` und `oauthClientId`, die der Grant zusätzlich erwartet — und
eine Bestätigungsseite bauen, die `/device/approve` bzw. `/device/deny` aufruft.

Die OAuth-Tabellen in `src/db/schema.ts` (`oauth_client`, `oauth_consent`, `oauth_access_token`,
`oauth_refresh_token`, …) sowie `jwks` sind vom Plugin vorgegeben und wurden aus dessen eigener
Schema-Definition generiert, nicht von Hand geschrieben.

## Verbundene Clients ansehen & trennen

Auf `/account` listet der Abschnitt „Verbundene Clients" jede Zustimmung, die du erteilt hast —
Client-Name, Scopes und seit wann. Eine Zustimmung ist der dauerhafte Datensatz („dieser Client
darf für mich handeln") und überlebt einzelne Tokens; deshalb wird sie gelistet, nicht die Tokens.

„Trennen" löscht die Zustimmung über `/oauth2/delete-consent` (der Endpoint prüft selbst, dass sie
dem angemeldeten Nutzer gehört) und markiert anschließend die ausgestellten Access- und
Refresh-Tokens als widerrufen.

## Bekannte Einschränkungen

- **Ein bereits ausgestelltes Access Token bleibt bis zum Ablauf gültig.** Access Tokens sind
  signierte JWTs und werden zustandslos gegen die JWKS geprüft — ein Widerruf in der Datenbank
  wirkt für sie nicht sofort. Beim Trennen endet deshalb sofort die _Erneuerung_ (Refresh Token,
  Zustimmung), das laufende Access Token läuft aber noch bis zu einer Stunde
  (`accessTokenExpiresIn`, Default 3600 s). Das ist normales OAuth-Verhalten; wer sofortige
  Sperrung braucht, müsste auf Introspection statt lokaler JWT-Prüfung umstellen.
- **Client-Registrierung ist offen.** `allowDynamicClientRegistration` und
  `allowUnauthenticatedClientRegistration` sind aktiv, damit sich MCP-Clients ohne Vorabsprache
  verbinden können. Jeder kann also einen Client registrieren — Zugriff bekommt er aber erst
  durch deine ausdrückliche Zustimmung auf `/consent`. Für eine geschlossene Installation beide
  Optionen in `auth.ts` abschalten und Clients über `/oauth2/create-client` anlegen.
