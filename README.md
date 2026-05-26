# Ressurs CRM

Internt CRM-verktøy for Ressurs Kompetanse AS — bygget for omstilling, karriereutvikling og kompetanseheving.

**Live på:** _(Vercel-URL fylles inn etter deploy)_

---

## Stack

- **Frontend:** React 18 + Babel (in-browser), vanilla CSS-in-JS
- **Backend:** Supabase (Postgres + Auth)
- **Hosting:** Vercel (statisk)

Ingen build-prosess — endringer i `.jsx` og `.html` deployes direkte når GitHub pushes.

---

## Komme i gang lokalt

```bash
# Klon repoet
git clone https://github.com/<bruker>/ressurs-crm.git
cd ressurs-crm

# Åpne med en lokal webserver (Python, Node eller VS Code Live Server)
python3 -m http.server 5500
# Eller:
npx serve .

# Åpne http://localhost:5500 i nettleseren
```

> ⚠️ Det er ikke nok å åpne `index.html` direkte — Babel og fetch krever HTTP-server.

---

## Filstruktur

| Fil | Innhold |
|-----|---------|
| `index.html` | Hovedsiden — laster alle script og kjører React |
| `App.jsx` | Top-level routing + sidebar + auth-gate |
| `helpers.jsx` | Designtokens, formattere, delte komponenter (Button, Card, Modal …) |
| `supabase-config.js` | URL + publishable key til Supabase-prosjektet |
| `supabase-store.jsx` | Datalag: henter/skriver mot Supabase, login-skjerm |
| `seed.js` | Statiske eksempeldata (brukes ikke etter at Supabase er på plass; beholdes for referanse) |
| `Oversikt.jsx`, `Kunder.jsx`, `Kundeprofil.jsx`, `Pipeline.jsx`, `Rapporter.jsx`, `Tilbud.jsx`, `Intern.jsx`, `Innstillinger.jsx` | Skjermbilder for hver fane |
| `assets/` | Logoer (PNG) |
| `supabase/01-schema.sql` | Databaseskjema — referanse, allerede kjørt i Supabase |
| `vercel.json` | Hostingkonfigurasjon |

---

## Database

Skjemaet ligger i `supabase/01-schema.sql`. Det er allerede kjørt i prosjektet
(`lgiwcqmwbpdipucshqxy.supabase.co`). Hvis du oppretter et nytt Supabase-prosjekt,
kjør filen via SQL Editor → New query.

### Tabeller
- `team_members` — ansatte
- `pakker` — leveransepakker (Omstilling, Ekspertbistand, …) med møter og tillegg
- `kunder` — kunder + tidslinje av aktiviteter
- `tilbud` — genererte tilbud
- `interne_notater` — mandagsmøter, ideer
- `innstillinger` — selskap, avtalemal, tilbudsteller (key-value)

### Sikkerhet
Row Level Security er aktivert — kun innloggede brukere får tilgang.
Anonyme brukere får ingenting.

---

## Brukeradministrasjon

Brukerkontoer lages i Supabase:
1. Logg inn på supabase.com → åpne prosjektet
2. **Authentication → Users → Add user → Create new user**
3. Fyll inn e-post + et midlertidig passord
4. Kryss av **Auto Confirm User**

Brukeren kan bytte passord senere (vi kan legge til "glemt passord"-flyt
senere — krever at Supabase får sende e-post via egen SMTP).

---

## Deploy

Push til `main`-branchen i GitHub → Vercel deployer automatisk på ~30 sekunder.
Ingen miljøvariabler trengs — `supabase-config.js` er bundlet med koden
(publishable key er åpent designet for klient-bruk).

---

## Vedlikehold

### Endre selskapsinfo, pakker, team
Gjøres direkte i appen → **Innstillinger**. Endringer lagres til Supabase.

### Endre avtalemal
**Innstillinger → Avtalemal**. Plassholdere
(`{{KUNDE_NAVN}}`, `{{PAKKEPRIS}}`, osv.) flettes automatisk inn ved tilbud.

### Backup
Supabase Free har 7 dagers automatisk backup. For lengre historikk:
**Database → Backups** i Supabase-dashbordet, eller eksporter CSV per tabell
fra Table Editor.

### Tilbakestille til seed-data
Det finnes ingen "reset"-knapp lenger — det ville slettet ekte data.
Hvis du virkelig vil starte på nytt, kjør `01-schema.sql` igjen (den har
`on conflict do nothing` så den er trygg å re-kjøre, men sletter ikke).
For full reset: drop tabellene og kjør skjemaet på nytt.
