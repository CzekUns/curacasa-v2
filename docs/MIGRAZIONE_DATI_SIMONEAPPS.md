# Migrazione CuraCasa: da simoneapps alla versione CzekUns

**Destinatari:** agenti di sviluppo, manutentori, operatori che trasferiscono i dati di un singolo utente.
**Stato:** guida operativa; non è uno script automatico di migrazione né una garanzia che gli account siano sincronizzati.
**Data della ricognizione:** 31 ottobre 2026.

## 0. Fonti di verità da leggere prima di scrivere codice

| Ruolo | Repository / file | Note |
| --- | --- | --- |
| Origine, versione pubblicata | https://github.com/simoneapps/curacasa-v2/blob/f69e4f78d8cbdcb64e77d88e0f4e940e42f33e91/src/lib/store.ts | Schema e chiave di memorizzazione legacy verificati |
| Backup originario | https://github.com/simoneapps/curacasa-v2/blob/f69e4f78d8cbdcb64e77d88e0f4e940e42f33e91/src/routes/Settings.tsx | Esporta/importa il JSON locale |
| Catalogo originario | https://github.com/simoneapps/curacasa-v2/blob/f69e4f78d8cbdcb64e77d88e0f4e940e42f33e91/public/chore-packs.json | 67 preset storici; titoli e icone originali |
| Destinazione | ../src/lib/store.ts | AppData, loadData(), saveData(), importPresets(), limiti log |
| Classificazione | ../src/lib/chore-levels.ts | BASE / PRO / SUPER / SPECIALE / TUA; alias dei preset |
| Posizione faccende | ../src/lib/chore-rooms.ts | Inferenza delle roomRule legacy |
| Stanze | ../src/lib/rooms.ts | Normalizzazione roomDetails |
| Catalogo aggiornato | ../public/chore-packs.json | 67 pill, incluse varianti 2 e speciali |
| Test di regressione | ../tests/chore-levels.test.mjs | Alias, categorie, preservazione dei log |
| Backup destinazione | ../src/routes/Settings.tsx | Importa un JSON, salva e poi rilegge |

**Non limitarsi a copiare il contenuto dello Store.** La fonte primaria dei dati dell'utente è il suo salvataggio locale: catalogo e configurazione predefinita non ricostruiscono i completamenti, le modifiche o la cronologia.

## 1. Che cosa si trasferisce e dove si trova

**Origine:** versione GitHub Pages del repository simoneapps/curacasa-v2.
**Destinazione:** versione CzekUns/curacasa-v2.

Entrambe usano la chiave localStorage **curacasa_v2_data** e un JSON con tre campi principali: rooms, chores, logs. Tuttavia, localStorage è **separato per origine web e profilo/browser**: la stessa chiave su due URL GitHub Pages diversi non condivide i dati. La PWA installata normalmente utilizza lo storage della sua stessa origine/profilo.

Nel salvataggio originario:

~~~ts
type AppDataLegacy = {
  rooms: string[]; // etichette delle stanze
  chores: Array<{
    id: string; title: string; description: string; icon: string;
    type: "ordinaria" | "straordinaria";
    room: string; frequency: number; estimatedMinutes: number;
    notes: string; createdAt: string; updatedAt: string;
  }>;
  logs: Array<{
    id: string; choreId: string; completedAt: string;
    durationMinutes: number; durationSeconds?: number;
    note: string; rooms: string[];
  }>;
};
~~~

Nella destinazione sono state **aggiunte**, senza sostituire gli ID storici:

~~~ts
type AppDataCurrent = {
  rooms: string[];
  roomDetails?: Record<string, {
    kind: "cucina" | "bagno" | "camera" | "salone" | "balcone" | "altro";
    note: string;
    color: number; // 0..7, preferibilmente diverso tra stanze dello stesso tipo
  }>;
  chores: Array<AppDataLegacy["chores"][number] & {
    level?: "base" | "pro" | "super" | "speciale" | "tua";
    roomRule?:
      | { mode: "any" }
      | { mode: "type"; kind: "cucina" | "bagno" | "camera" | "salone" | "balcone" }
      | { mode: "specific"; names: string[] };
    presetKey?: string; // identità storica del preset, non dell'attività dell'utente
  }>;
  logs: AppDataLegacy["logs"];
};
~~~

Il campo **type** ordinaria/straordinaria resta indipendente da **level**. Non convertire l'uno nell'altro. Non cambiare a caso frequency, date, stime, note o durata dei log.

**Altri dati:** l'eventuale tema è nella chiave separata curacasa_v2_theme (versione nuova), non dentro AppData. Le preferenze delle notifiche, le sottoscrizioni push e l'identità Clerk non si ricavano da questo JSON. Se serve, riconfigurare le notifiche sul dispositivo di destinazione. L'accesso Clerk **non implica sincronizzazione automatica** del localStorage.

## 2. Procedura prudente per un singolo utente

1. **Prima di visitare o ricaricare l'app origine**, fare una copia non distruttiva del valore grezzo della chiave curacasa_v2_data tramite gli strumenti del browser (Application/Storage → Local Storage) e salvarla in un file JSON privato. In alternativa usare **Impostazioni → Esporta backup** sulla vecchia app, se il contenuto visualizzato corrisponde ai dati attesi.
2. **Avvertenza origine:** il vecchio loadData() contiene una regola che, se tutte le faccende hanno alcuni titoli legacy predefiniti e non esistono log, può **azzerare chores** al caricamento. Per questo la copia grezza da storage prima del caricamento è più prudente dell'export UI. Non fare affidamento su dati già cancellati: servono un vecchio backup o una fonte indipendente.
3. Annotare inventario originale: numero stanze, faccende, log, ID delle faccende, numero di log per ciascun choreId, range date, eventuali duplicati. Registrare l'hash SHA-256 del backup, non divulgarne il contenuto.
4. Nell'app di destinazione, **esportare prima il suo backup** se contiene già dati: importare dalla UI attualmente **sovrascrive** il salvataggio e non effettua una fusione intelligente.
5. Convertire una **copia** del JSON legacy seguendo i paragrafi successivi. Non alterare l'originale. Validare il file senza coinvolgere dati reali di terzi in log/issue pubblici.
6. Se il target è vuoto, usare **Impostazioni → Importa backup** sulla nuova app con il file convertito. Controllare categorie, numero di ambienti, faccende e storico prima di continuare. L'importazione attuale fa JSON.parse → saveData(parsed) → loadData(); **non è un validatore transazionale**. Non importare file di origine incerta o con schema non verificato.
7. Se il target **contiene già dati**, non importare direttamente: un agente deve costruire una fusione controllata con mappa degli ID, riconciliazione delle stanze e dei log, anteprima dei conflitti e rollback; poi importare il risultato.
8. Verificare in app almeno: Home, Faccende, Calendario, selettore stanze, modifica delle faccende, Store (pill già possedute), livelli e date di scadenza.
9. Conservare separatamente l'originale e il backup pre-importazione della destinazione. Solo dopo verifica confermare la migrazione; non cancellare automaticamente dati dalla sorgente.

## 3. Mapping delle stanze

**Non sostituire** automaticamente Soggiorno con Salone: è la vecchia etichetta dell'utente e la destinazione la riconosce già come tipo salone.

- Conservare rooms nell'ordine originale, compresi nomi personalizzati, maiuscole, spazi e note nominali.
- Creare roomDetails tramite **normalizeRoomDetails(rooms)**, oppure lasciare che loadData() lo ricostruisca; salvare poi i dati normalizzati, se si produce un file migrato.
- La funzione **guessRoomKind()** riconosce per nome cucina, bagno, camera/letto, salone/soggiorno, balcone/terrazzo. Nomi non identificabili diventano **altro**, mai eliminati.
- In roomDetails, **kind** determina l'SVG, **color** è uno slot 0..7 relativo al tema, **note** è un testo opzionale. Non inventare nuovi ambienti e non rinominare le stanze solo per uniformità estetica.
- Conservare nei log le stringhe rooms così come registrate. Se una stanza è stata cancellata o rinominata nel tempo, **segnalare** il riferimento storico non più presente; non riscrivere silenziosamente la cronologia.

## 4. Mapping dello scope delle faccende

Ogni Chore mantiene **room** (legacy) e ottiene **roomRule**. Usare **getRoomRule(chore)** / **roomRuleFromLegacy(chore.room)** nel codice, non una nuova euristica separata.

| room legacy | roomRule destinazione |
| --- | --- |
| "Tutta casa", "Tutta la casa", vuoto | {"mode":"any"} |
| "Bagno" | {"mode":"type","kind":"bagno"} |
| "Cucina" | {"mode":"type","kind":"cucina"} |
| "Camera" | {"mode":"type","kind":"camera"} |
| "Soggiorno", "Salone" | {"mode":"type","kind":"salone"} |
| "Balcone" | {"mode":"type","kind":"balcone"} |
| "Bagno di servizio", "Studio privato", qualunque altro nome | {"mode":"specific","names":["nome originale"]} |

**Attenzione:** "Bagno di servizio" non diventa automaticamente **tutti i bagni**; è una singola stanza indicata dall'utente. Non forzare faccende generiche preesistenti su un'unica stanza, a meno di un'esplicita decisione sulla migrazione.

**Completamenti:** ChoreLog.rooms indica le stanze dove l'operazione è stata *registrata*, e non coincide necessariamente con Chore.room o Chore.roomRule. Mantenere ogni valore originale, anche []: **assenza di luogo non significa "Tutta la casa"**. Il sistema nuovo permette più stanze per un unico log; quello legacy può già conservarle.

## 5. Cinque categorie: BASE / PRO / SUPER / SPECIALE / TUA

Il campo memorizzato è **chore.level**, minuscolo. I badge UI sono maiuscoli.

- **BASE:** attività essenziali e generiche.
- **PRO:** pulizie più approfondite o specifiche.
- **SUPER:** interventi dettagliati/complessi.
- **SPECIALE:** attività legate ad attrezzature particolari; è una categoria autonoma, **non** una sotto-categoria di PRO o SUPER.
- **TUA:** attività create manualmente dall'utente.

Lo Store contiene **67 pill selezionabili separatamente**: **29 BASE, 23 PRO, 10 SUPER, 5 SPECIALE**. TUA si applica alle faccende aggiunte manualmente (non è un preset dello Store).

Le cinque pill SPECIALE riconosciute dal catalogo attuale sono:

| Titolo Store | Icona | Prima della nuova classificazione |
| --- | --- | --- |
| Passare Dyson | dyson | PRO |
| Pulire accessori Dyson | dyson-accessori | SUPER |
| Passare Folletto | folletto | BASE |
| Passare scopa elettrica | scopa-elettrica | BASE |
| Avviare robot aspirapolvere | robot-aspirapolvere | BASE |

**Riconoscimento origine:** il repository simoneapps non ha level né presetKey. Se **titolo normalizzato + icon** corrisponde *esattamente* a un preset originale, usare la sua categoria nel nuovo catalogo, con SPECIALE per i cinque casi sopra. Altrimenti classificare la faccenda come **tua**. Non basta l'icona da sola: un utente può aver creato manualmente una faccenda con un'icona del catalogo. L'origine legacy non contiene una prova certa di quale pulsante abbia creato il record: in caso di ambiguità, conservare il record e segnalarlo; non inventare la sua provenienza.

**Conversione di una versione intermedia già aggiornata:** se il record è noto come preset (presetKey originale o firma esatta) e compare nell'elenco SPECIAL, portarlo a speciale anche se aveva level base/pro/super. Un level tua esplicito prevale, per preservare le attività personali. Per gli altri record conservare il level valido esistente; in sua assenza utilizzare **classifyChoreLevel()**.

## 6. Varianti grafiche: due pill, non due attività da fondere

**Non ridurre i preset da 67 a 64.** Esistono tre coppie di attività molto simili proposte come **pill distinte** nello Store; il loro valore è l'illustrazione alternativa:

| Vecchio titolo | Nuovo titolo Store | Icona immutata | Categoria |
| --- | --- | --- | --- |
| Mocio e secchio | Lavare pavimento 2 | mocio-secchio | BASE |
| Pulire finestra | Pulire vetri 2 | finestra-tende | PRO |
| Pulire tapparella grande | Pulire tapparelle 2 | tapparella-grande | SUPER |

Gli altri membri delle coppie restano **Lavare pavimento** (pavimento), **Pulire vetri** (vetri), **Pulire tapparelle** (tapparelle).

Altre due correzioni di denominazione dello Store:

| Vecchio titolo | Nuovo titolo Store | Motivazione |
| --- | --- | --- |
| Pulire doccia | Pulire soffione doccia | Il soffione è distinto da Pulire box doccia |
| Biancheria letto | Lavare biancheria da letto | Il lavaggio è distinto da Cambio letto |

**Regole di migrazione:**

- Non rinominare in massa i titoli delle faccende **già salvate dall'utente**: possono essere stati personalizzati. I titoli nuovi sono quelli del catalogo Store; il record importato conserva il proprio title.
- Conservare **icon** come ID logico; i vecchi .jpg diventano immagini .webp o SVG nella nuova app, senza modificare il campo. Per gli alias storici bath → bagno, bed → letto, home → casa, kitchen → cucina, laundry → lavatrice, living → soggiorno, plant → piante, trash → pattumiera, vacuum → aspirapolvere, window → vetri, riusare **LEGACY_ICON_MAP** in store.ts.
- Non cambiare gli ID della faccenda, né i riferimenti choreId dei log.
- I preset rinominati devono mantenere la **firma storica** per non poter essere aggiunti di nuovo per errore. La funzione **presetIdentity()** in chore-levels.ts applica il mapping delle cinque coppie vecchio/nuovo titolo: per es. "Lavare pavimento 2::mocio-secchio" conserva l'identità "Mocio e secchio::mocio-secchio".
- **presetKey** va assegnato ai preset storici identificati con sufficiente certezza e preservato anche se l'utente cambia titolo in futuro; **non** assegnare presetKey a una faccenda TUA non riconosciuta.
- Due pill con **icone diverse** hanno identità diverse anche quando descrivono la medesima azione. Non fonderle automaticamente: l'utente può aver aggiunto volontariamente entrambe e averle completate in date diverse.

## 7. Log, ID, ricorrenze: invarianti obbligatori

- Conservare **tutti i Chore.id**; ogni ChoreLog.choreId deve riferire esattamente all'ID conservato.
- Conservare **tutti i ChoreLog.id**, completedAt, durationMinutes, durationSeconds (anche se assente), note e rooms.
- Non cancellare i log legacy **duplicati nello stesso giorno**: la versione simoneapps consentiva ripetizioni; quella nuova impedisce solo nuovi completamenti per stessa faccenda/data civile. I dati storici duplicati sono dati dell'utente, non errori da distruggere.
- Conservare frequency, estimatedMinutes, createdAt e updatedAt. **Il calcolo delle scadenze è cambiato**: nel nuovo algoritmo, se una faccenda non ha log, la prima scadenza deriva da createdAt + frequency; un cambio di indicatore non è necessariamente una perdita di dati.
- Non usare il testo della faccenda come ID, non generare nuovi ID salvo conflitti documentati durante una fusione con dati già presenti.
- Un log orfano (choreId mancante) va conservato nel backup originario, segnalato per risoluzione e **mai collegato per somiglianza del titolo**.

## 8. Bozza dell'algoritmo per un agente

Questa è una specifica, non codice da eseguire direttamente su dati di produzione:

~~~text
INPUT: backup_origine.json
1. PARSE + VALIDATE: object, arrays rooms/chores/logs; snapshot immutabile.
2. CHECK: ID faccende unici; log ID; riferimenti choreId; date parseabili;
   room references, interi non negativi per frequency/duration.
3. CLONE: mantenere l'ordine e tutti i campi originali, compresi dati extra
   riconosciuti; conservare a parte ogni campo sconosciuto potenzialmente utile.
4. rooms: preservare i nomi; roomDetails = normalizeRoomDetails(rooms,
   eventuali roomDetails già validi).
5. per ciascuna chore:
   a. non cambiare id, title, type, frequency, timestamps o notes;
   b. normalizzare icon via LEGACY_ICON_MAP;
   c. roomRule = getRoomRule(chore);
   d. se presetKey storico già presente, mantenerlo;
      altrimenti, se titolo+icona combaciano con un preset originale,
      presetKey = presetIdentity(preset legacy);
   e. level = classifyChoreLevel(chore con icon/presetKey aggiornati);
      quando origine non distinguibile da attività personale, sospendere
      l'attribuzione automatica e registrare l'ambiguità.
6. logs: copia integrale; non deduplicare e non sostituire rooms vuote.
7. ASSERT: stesso numero di chores/logs dell'origine;
   stessi ID e timestamp; nessun log perso; room originali invariati;
   categorie solo base/pro/super/speciale/tua; roomRule valida.
8. OUTPUT: backup_migrato.json + report di migrazione separato + SHA-256;
   includere eventuali anomalie e lista dei record da controllare.
9. DRY RUN: test con dati fittizi; esportazione del target esistente;
   importazione controllata nel target; verifica UI + secondo export.
10. ROLLBACK: reimportare backup target precedente se qualcosa non torna.
~~~

## 9. Verifiche obbligatorie e casi test

Usare i test **tests/chore-levels.test.mjs**, **tests/chore-rooms.test.mjs** e **tests/store.test.mjs**.

Comando dal repository:

~~~bash
npm ci
npm run build
npm run test:logic
~~~

Casi da aggiungere/controllare con backup fittizi:

- Origine vuota; origine con faccende ma zero log; origine con soli titoli di default (rischio azzeramento nel vecchio loadData).
- Un bagno e due bagni, incluso "Bagno di servizio"; Soggiorno + Salone; stanza sconosciuta "Studio privato".
- Almeno un log senza rooms, uno con più rooms, due nello stesso giorno, uno con durataSeconds.
- Una faccenda personale con icona del catalogo e titolo diverso: level **tua**.
- Una vecchia "Passare Dyson" (PRO) importata come **SPECIALE**.
- Una vecchia "Mocio e secchio" e il nuovo Store "Lavare pavimento 2": **nessun doppio import della stessa pill**.
- "Lavare pavimento" e "Lavare pavimento 2": due pill autonome e nessuna fusione dei log.
- Log orfani, ID duplicati, stanza rimossa e titoli modificati: segnalare, non correggere distruttivamente.
- Seconda migrazione dello **stesso backup** non deve aggiungere doppioni (idempotenza).

## 10. Portafoglio CuraCoin (versione successiva: ottobre 2026)

Dopo l'introduzione della gamificazione, il modello `AppData` aggiunge un campo opzionale `wallet`; `ChoreLog` aggiunge `curaCoins?: number`. La fonte attuale è `src/lib/store.ts`, non questo documento.

```ts
type CuraWallet = {
  balance: number;
  lifetimeEarned: number;
  loginRewards: Record<string, {
    sessionId: string; // Clerk, mai inventato dall'importazione
    awardedAt: string; // data ISO dell'ultimo accredito a quell'account
  }>;
};
```

**Regole per l'agente migratore:**

- Un backup simoneapps **non** contiene né `wallet` né `curaCoins`: creare `wallet: {balance:0,lifetimeEarned:0,loginRewards:{}}` oppure lasciarlo assente; `loadData()` normalizza automaticamente. **Non attribuire retroattivamente** CuraCoin ai log precedenti, anche se hanno il numero di stanze.
- Conservare i log e gli ID esattamente come erano. Lasciare `curaCoins` **assente** sui log storici; significa che non hanno generato premi.
- Nei nuovi completamenti l'app accredita **max(1, numero di stanze distinte selezionate)**; una registrazione senza luogo vale 1. L'azione è contabilizzata una sola volta, anche da calendario.
- Nei nuovi log `curaCoins` fotografa il premio riconosciuto al momento della registrazione. La modifica delle stanze di quel log aggiorna il saldo per differenza e la cancellazione ne sottrae i crediti; non modificare il saldo quando si corregge un log storico senza `curaCoins`.
- Il premio di **30 CuraCoin** avviene soltanto in presenza di un accesso Clerk autenticato; non deve essere ricreato, simulato o assegnato dall'importazione. Per i premi successivi servono **entrambe** le condizioni: sono trascorse 168 ore dall'ultimo bonus **e** l'utente ha effettuato un nuovo login con una sessione Clerk creata dopo la scadenza dei 7 giorni. Logout/login prima dei 7 giorni o semplice refresh della sessione non accredita nulla.
- Un backup con wallet valido può già contenere premi: preservarlo integralmente ed evitare che l'importazione conceda subito 30 CuraCoin come effetto collaterale. L'app è attualmente frontend/localStorage: questa contabilità non è antifrode o sincronizzata tra dispositivi. Per un'economia monetizzabile occorre convalidare le operazioni su un backend.

**Nota sulla datazione:** la nuova logica dei CuraCoin entra in vigore con la relativa pubblicazione. Non assumere che i salvataggi legacy abbiano già beneficiato di bonus o ricompense.

**Regola finale:** la migrazione aggiorna la **struttura e la classificazione**, non riscrive la storia dell'utente. In caso di dubbio lasciare il dato intatto, documentare l'incertezza e richiedere una scelta esplicita prima di una trasformazione irreversibile.
