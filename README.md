# CuraCasa V2

CuraCasa V2 e' una PWA statica basata sullo stesso stack di CuraMotori:

- Vite
- React
- TypeScript
- React Router
- Clerk per autenticazione (`@clerk/react`)
- lucide-react per icone
- Render Static Site per deploy

Quickstart Clerk React: https://clerk.com/docs/react/getting-started/quickstart

## Setup locale

```bash
npm install
copy .env.example .env.local
npm run dev
```

Valorizza:

```bash
VITE_CLERK_PUBLISHABLE_KEY=...
```

## Build

```bash
npm run build
```

## Deploy Render

Usa `render.yaml`:

- build command: `npm install && npm run build`
- publish directory: `dist`
- rewrite: `/* -> /index.html`

Su Render aggiungi la variabile ambiente:

```bash
VITE_CLERK_PUBLISHABLE_KEY
```

## Funzioni allineate a CuraCasa pubblicata

- Homepage pubblica con login/registrazione Clerk.
- Area protetta con 5 tab: Home, Faccende, Aggiungi, Calendario, Opzioni.
- Stanze rapide e gestione stanze.
- Lista faccende filtrabile.
- Creazione faccenda con tipo, stanza, scadenza, minuti e note.
- Registrazione svolgimento.
- Calendario mensile e registrazioni arretrate.
- Backup JSON export/import.

I dati applicativi sono locali al browser in questa versione statica; Clerk governa accesso e sessione.

## SEO e homepage

La homepage e' pubblica e ha un contenuto HTML iniziale gia' leggibile dai crawler.
Le schermate personali restano sotto HashRouter e non sono destinate all'indicizzazione.

La demo `CzekUns/curacasa-v2` usa `SEO_INDEXABLE=false`: non va indicizzata
per evitare che la copia di prova competa con la versione ufficiale.

Quando pubblichi la versione ufficiale, configura nel sistema di build:

```bash
SEO_SITE_URL=https://tuo-dominio.it/
SEO_INDEXABLE=true
```

Il build genera canonical, metadati social, dati strutturati WebApplication e
`sitemap.xml`; genera `robots.txt` solo se l'URL del sito e' sulla radice
del dominio. Imposta questi valori prima di mettere online la versione
ufficiale, poi registra il dominio in Google Search Console e invia la sitemap.

I testi principali si aggiornano in `src/content/landing.ts`.
L'app e la preview GitHub Pages continuano a usare la configurazione Clerk
gia' esistente, senza modifiche alle sessioni o ai pagamenti.


## Identità CuraCasa e accesso

Il marchio ufficiale è in `public/brand/mark.svg` e `logo.svg`. Favicon,
icone PWA (192/512), variante maskable, icona iOS e file ICO vengono
generati da `scripts/generate_brand_icons.py` a partire dagli SVG.

Nella homepage l'ingresso è animato una volta sola tramite CSS e rispetta
`prefers-reduced-motion`. Nessuna animazione blocca la navigazione o il login.

La versione GitHub Pages di test usa `VITE_DEMO_BYPASS_AUTH=true`: il pulsante
«Scopri l'accesso» apre `#/accesso`, una *anteprima di stile*, non una pagina
di autenticazione. Il bottone «Apri demo» accede senza account.

Quando la variabile demo è disabilitata e la chiave Clerk è configurata,
«Inizia gratis» e «Accedi» aprono le vere modali Clerk, personalizzate con
palette, logo e localizzazione italiana ufficiale. Clerk continua a gestire
verifica, sicurezza, OAuth e sessioni; le quote del piano non cambiano.

La PWA installata parte da `#/app` per non ripetere la presentazione ogni
volta. Dopo l'aggiornamento del logo potrebbe essere necessario reinstallare
il collegamento PWA su alcuni telefoni per aggiornare l'icona.


## Palette e icone compatte

Lo sfondo di tutte le pagine utilizza la stessa sfumatura della schermata
d'accesso: avorio `#faf5ef`, rosa cipria `#f5e5e1`, salvia `#e6eeed`.
Le card hanno fondi semitrasparenti chiari, mentre la navigazione inferiore
usa vetro opalino invece del precedente nero.

- `public/brand/mark.svg`: logo originale, con cerchio e ramoscello,
  conservato per la presentazione in grande.
- `public/brand/compact-mark.svg`: casa/cuore/foglia con linee più decise
  per i piccoli marchi nell'interfaccia.
- `public/brand/favicon.svg`: casa e cuore ingranditi, senza ramo e senza
  cerchio, per restare leggibili a 16/32 px.
- `public/brand/app-icon.svg` e `app-icon-maskable.svg`: versione compatta
  della PWA (con margine di sicurezza nella maskable).

Tutti i PNG e `favicon.ico` sono derivati dagli SVG dallo script
`scripts/generate_brand_icons.py`. Per rigenerarli eseguire manualmente
il workflow **Render CuraCasa PWA brand icons** sul branch di lavoro.


## Store, faccende giornaliere e temi (ottobre 2026)

- Lo Shop importa i preset tramite `importPresets()`, con un'identità
  persistente (`presetKey`) basata su titolo+icona. I preset già presenti
  vengono disabilitati; le collezioni importano **solo quelli mancanti**.
  Gli import precedenti senza `presetKey` sono riconosciuti se conservano
  titolo e icona originali. Le copie già presenti non vengono eliminate
  automaticamente, per non compromettere cronologia e riferimenti.
- Non vengono più eliminate le faccende legittime solo perché hanno i nomi
  usati nelle vecchie attività predefinite.
- Una faccenda si registra al massimo **una volta per data locale**.
  I pulsanti in Home e Faccende risultano bloccati una volta svolta oggi.
  Il Calendario permette la scelta di un'altra data e mostra le attività
  già svolte in quella selezionata. La verifica avviene anche nella funzione
  `addLog()`, non soltanto nell'interfaccia.
- La conferma di import e completamento mostra una microanimazione con check,
  compatibile con `prefers-reduced-motion` e annunciata agli screen reader.
- Nella scheda **Shop → Temi**, Classico (predefinito) e Cipria cambiano
  soltanto palette e colori delle superfici. Geometria, sfumature,
  posizionamento e funzionalità rimangono gli stessi. La preferenza viene
  memorizzata nella chiave `curacasa_v2_theme`, separatamente dai dati
  delle pulizie.
- Per regressione: `npm run test:logic` (Node.js 22), oltre alla build.
