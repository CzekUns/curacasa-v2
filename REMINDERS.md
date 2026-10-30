# CuraCasa — promemoria scadenze e Web Push

## Stato del progetto

La PWA ora calcola correttamente le scadenze anche delle faccende mai
completate, segnala il **giorno esatto** e aggiorna l'elenco quando si torna
nell'app. Questi promemoria **nell'app** funzionano già su GitHub Pages.

Per ricevere notifiche **con l'app chiusa** è necessario installare il servizio
opzionale in `reminders-worker/`. GitHub Pages non può inviare Web Push in
background. Il Worker usa soltanto il JWT di Clerk, Cloudflare D1 e Web Push
standard (VAPID), senza Firebase/Supabase.

> IMPORTANTE: nel fork demo la chiave Clerk è intenzionalmente assente.
> Finché non viene distribuito il Worker e non vengono impostate entrambe
> le variabili VITE_REMINDERS_*, in Impostazioni appare correttamente
> "Il servizio notifiche non è ancora collegato". Non si simulano
> notifiche push che non possono partire.

## Comportamento

- **Faccenda mai svolta:** primo termine = data di creazione + frequenza.
- **Faccenda già svolta:** termine = ultima esecuzione + frequenza.
- **Oggi:** il contatore vale zero, appare "Da fare oggi".
- **In arrivo:** entro il 30% della frequenza o almeno un giorno prima.
- **Scaduta:** da un giorno dopo il termine, fino al nuovo completamento.
- **Senza frequenza:** non inviare avvisi.
- **Web Push:** una notifica al giorno per dispositivo, alle 09:00 oppure
  18:00 **ora locale**, solo se esistono attività scadute/da fare oggi.
  Il cron controlla ogni ora in UTC, rispettando il fuso del dispositivo.
  Non usa timer nel browser e non necessita di sessione Clerk attiva
  quando la PWA è chiusa.
- Quando l'utente tocca l'avviso, si apre l'elenco faccende.
- Le attività già completate vengono escluse dalla successiva
  sincronizzazione quando si utilizza l'app.

## Per attivare davvero le notifiche fuori dall'app

Prerequisiti: account Cloudflare, account Clerk già in uso, Node.js 22+,
dominio GitHub Pages o produzione HTTPS e app installata sul telefono.

1. Crea un database Cloudflare D1 (piano gratuito per piccoli volumi):
   `npx wrangler d1 create curacasa-reminders`.
2. Sostituisci `REPLACE_WITH_REAL_D1_DATABASE_ID` nel
   `reminders-worker/wrangler.jsonc` con l'identificativo restituito.
3. Nella directory `reminders-worker`: `npm install`, poi
   `npx wrangler d1 migrations apply curacasa-reminders --remote`.
4. Genera una coppia VAPID una sola volta:
   `node --input-type=module -e "import {generateVapidKeys} from '@mmmike/web-push/vapid'; console.log(await generateVapidKeys())"`.
   La **private key** non deve mai entrare nel repository.
5. Modifica `VAPID_PUBLIC_KEY` e `VAPID_SUBJECT` nel file
   `wrangler.jsonc`. Il subject deve essere un indirizzo verificabile
   `mailto:...`.
6. Dal pannello Clerk, API Keys, **JWT public key PEM**:
   aggiungila al Worker come segreto con
   `npx wrangler secret put CLERK_JWT_KEY` (incolla il PEM).
   Aggiungi anche la chiave privata con
   `npx wrangler secret put VAPID_PRIVATE_KEY`.
7. Imposta `ALLOWED_ORIGINS` all'origine esatta della versione
   autenticata, es. `https://tuo-dominio.it` (senza path).
   Deve corrispondere anche all'origin autorizzato di Clerk.
   **Non aprire CORS a tutti**.
8. Esegui `npm run deploy` dalla directory del Worker.
   Otterrai un URL HTTPS `https://...workers.dev`.
9. Sulla **build autenticata della PWA** aggiungi:
   `VITE_REMINDERS_API_URL=https://...workers.dev`
   `VITE_REMINDERS_VAPID_PUBLIC_KEY=<chiave pubblica VAPID>`.
   Ricompila e pubblica la PWA. In Impostazioni → Promemoria:
   scegli 09:00/18:00 e premi **Attiva notifiche**.
10. Il browser deve chiedere il permesso con un tap volontario. Su iOS
    da 16.4 in poi, **installa prima la PWA nella Home**, aprila
    dall'icona e poi abilita gli avvisi.

### Protezione dati e limiti

- Il Worker conserva in D1 soltanto identificativo Clerk, endpoint e
  chiavi pubbliche dell'abbonamento push, timezone, orario, ID delle
  faccende e **date di scadenza**. Non vengono sincronizzati titoli,
  nomi delle stanze, note, email o cronologia pulizie.
- Una sottoscrizione richiede JWT Clerk firmato e una origine consentita.
  Fino a 5 dispositivi per account; endpoint vincolati ai servizi Push.
- Premendo **Disattiva** la sottoscrizione è revocata nel browser e
  richiesta la cancellazione al Worker. In caso di rete assente,
  un'eventuale voce server rimasta non può più notificare.
- Il Worker è dimensionato per una **beta fino a 40 dispositivi**;
  prima di lanciare a pubblico più ampio, spostare la coda push su
  Workers Queues/batching e verificare limiti del piano.
- Notifiche Web Push sono best effort: rete, restrizioni del sistema
  operativo e risparmio batteria possono causare ritardi.
- Prima di raccogliere iscrizioni push nella produzione pubblica,
  aggiornare **privacy policy** e informativa ai sensi GDPR, includendo
  finalità e conservazione delle sottoscrizioni.
- Le API del Worker non sono abilitate sul fork demo; non inserire
  chiavi di produzione su un sito demo con login bypassato.

## Test

Nel repository principale: `npm run test:logic && npm run build`.
Nel Worker: `node --test tests/*.test.mjs`;
poi `npm install && npx wrangler deploy --dry-run`.

Riferimenti: https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers
e https://developers.cloudflare.com/workers/configuration/cron-triggers/.
