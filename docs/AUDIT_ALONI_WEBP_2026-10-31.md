# CuraCasa — verifica artefatti WebP (31 ottobre 2026)

## Intervento eseguito — pulizia conservativa

Sono stati rielaborati **12 file**, eliminando esclusivamente macchie isolate presso i margini:
`paletta`, `pavimento`, `termosifone`, `letto`, `tavolo`, `mattonelle`,
`lavastoviglie-manutenzione`, `lavastoviglie-sale`, `infissi`,
`tubi-esterni`, `tapparella-grande`, `zanzariera`.

- Script ripetibile: [`scripts/repair_isolated_chore_webp_stains.py`](../scripts/repair_isolated_chore_webp_stains.py)
- Confronto prima/dopo: [`docs/asset-review/chore-edge-cleanup-before-after.webp`](asset-review/chore-edge-cleanup-before-after.webp)
- Tutte le operazioni sono partite da un commit sorgente congelato, non da icone già corrette.
- **Nessun ritaglio o resize**: dimensioni e disegni conservati; solo porzioni di sfondo isolate sono state ricostruite.
- `src/lib/icons.tsx` incrementa la versione della cache per queste 12 icone.

**Limite prudenziale:** `infissi` e `tubi-esterni` conservano alcuni aloni addossati al soggetto (finestra/pianta, tubo/panno). Anche gli altri 10 difetti complessi rimangono nell'immagine originale, per non asportare disegni: `battiscopa`, `biancheria-letto`, `cuscini`, `dyson`, `filtro-condizionatore`, `folletto`, `mocio-secchio`, `pareti`, `robot-aspirapolvere`, `scopa-elettrica`.

Le 5 sfumature più lievi `addolcitore-manutenzione`, `addolcitore-sale`, `armadio`, `asciugamani`, `macchina-caffe` sono state lasciate intenzionalmente: non è possibile distinguere con certezza i raggi grafici dello sfondo da artefatti indesiderati senza alterare lo stile. I numeri dell'audit seguente sono riferiti alle **immagini iniziali**, non alla situazione dopo la pulizia.

**Repository:** `CzekUns/curacasa-v2`  
**Ambito:** tutte le **66** immagini `public/chore-icons/*.webp` sul ramo `main`.  
**Metodo:** controllo visivo dell'immagine integrale, inclusi bordi e angoli, non solo dei primi/ultimi file caricati. Per alcune immagini con difetti è stato controllato anche il JPG precedente alla conversione (commit antecedente a `f7b560c8230a`).

## Esito

| Stato | Numero |
| --- | ---: |
| Difetti chiaramente visibili | **20** |
| Residui/aloni più lievi da rifinire | **7** |
| Nessuna macchia evidente nell'ispezione visiva | **39** |
| **Totale** | **66** |

### Priorità alta — 20 WebP

| File (senza estensione) | Difetto |
| --- | --- |
| `battiscopa` | residuo grigio sotto il pavimento, angoli irregolari |
| `biancheria-letto` | macchie poligonali grigie attorno alle lenzuola e alla pianta |
| `cuscini` | fondo grigio frastagliato sotto i cuscini e attorno alla pianta |
| `dyson` | contorno poligonale grigio sulla parte superiore del motore |
| `filtro-condizionatore` | ampi aloni grigi ai quattro bordi del filtro e vicino alla pianta |
| `folletto` | alone grigio e frastagliato alla base dell'aspirapolvere |
| `infissi` | strisce grigie fuori dal bordo destro e nell'angolo inferiore destro |
| `lavastoviglie-manutenzione` | chiazza grigia isolata nell'angolo superiore destro |
| `lavastoviglie-sale` | residui grigi separati nell'angolo superiore destro |
| `letto` | grossa macchia grigia che entra dal margine sinistro |
| `mattonelle` | macchie colorate ai bordi destro e inferiore |
| `mocio-secchio` | maschera grigia a contorni frastagliati su mocio e secchio |
| `paletta` | forma grigia tagliata che entra dal margine superiore |
| `pareti` | residui grigio-verdi ai bordi del rullo e sul bordo inferiore |
| `pavimento` | macchia grigia che entra dall'alto |
| `robot-aspirapolvere` | alone grigio contornato attorno al robot e alla pianta |
| `scopa-elettrica` | macchia grigia poligonale attorno alla spazzola alla base |
| `tavolo` | frammento color malva proveniente dal margine sinistro |
| `termosifone` | forme estranee lungo il margine alto e sinistro |
| `tubi-esterni` | numerose maschere grigie, sinistra, destra e parte inferiore |

### Priorità media — 7 WebP

| File (senza estensione) | Osservazione |
| --- | --- |
| `addolcitore-manutenzione` | striature a ventaglio agli angoli, soprattutto in alto a destra |
| `addolcitore-sale` | striature visibili in alto a destra e in basso a sinistra |
| `armadio` | lievi sfumature radiali nell'area esterna |
| `asciugamani` | alone cromatico radiale nello sfondo intorno alla figura |
| `macchina-caffe` | striature ai margini destro e inferiore |
| `tapparella-grande` | striature presso la pianta, lato destro inferiore |
| `zanzariera` | macchia/raggi sul bordo destro inferiore |

### Nessuna macchia evidente in questa verifica — 39 WebP

`aspirapolvere`, `balcone`, `box-doccia`, `caldaia`, `cappa`, `casa`, `condizionatore`, `cucina`, `deumidificatore`, `divano`, `doccia`, `dyson-accessori`, `filtro-cappa`, `finestra-tende`, `forno`, `frigorifero`, `lampadario`, `lavandino`, `lavatrice`, `maniglie`, `materasso`, `mensole`, `mobiletti-esterni`, `pattumiera`, `piante`, `porta`, `scopa`, `sifone-lavandino`, `soggiorno`, `specchio`, `spolverino`, `tapparelle`, `tappeto`, `telecomando-batterie`, `tende-esterno`, `tende`, `vasca`, `vetri`, `wc`.

"Assenza di macchie evidenti" non significa qualità perfetta: alcune icone legacy restano sgranate o presentano uno sfondo crema con decorazioni. Qui viene segnalata esclusivamente la presenza di chiazze anomale.

## Origine e precauzioni prima di correggere

Le macchie poligonali **non sono un difetto del formato WebP**. Esempi verificati sui JPG anteriori alla conversione: `cuscini.jpg`, `filtro-condizionatore.jpg`, `paletta.jpg`, `tubi-esterni.jpg` mostrano già residui nello stesso punto. Ricomprimere in WebP non pulirà i file.

**NON** usare maschere arrotondate con un inset, tagli percentuali, zoom automatico o un'unica tinteggiatura uniforme di tutta l'illustrazione: in passato hanno rimpicciolito i disegni, ingrossato visivamente le cornici e cancellato dettagli.

Correzione suggerita per ogni asset:
1. Conservare l'originale in Git e lavorare su copia.
2. Distinguere l'oggetto e le sue ombre legittime dalle chiazze poligonali esterne.
3. Rimuovere solo i pixel spurii, ricostruendo localmente lo sfondo crema/avorio con un riempimento coerente, senza ritagliare o scalare il disegno.
4. Esportare mantenendo il canvas originale e convertire in WebP a qualità alta.
5. Confrontare prima/dopo su sfondo chiaro e sullo sfondo delle palette CuraCasa; rifiutare modifiche che cancellano pezzi dell'icona.
6. Invalidare la cache PWA delle **sole** icone corrette e verificare GitHub Pages.

**Nota:** la verifica ha esaminato i 66 WebP; `bagno.svg` è fuori ambito. Questo documento è un audit, **non** applica modifiche alle immagini.
