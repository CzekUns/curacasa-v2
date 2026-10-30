# CuraCasa — Libreria icone personali

## Scopo

Le icone dei **preset dello Store** rappresentano faccende specifiche
(aspirapolvere, bagno, condizionatore, ecc.) e restano riservate ai preset.

Chi crea una faccenda personalizzata deve poter scegliere un simbolo **neutro**
e non rischiare di usare immagini progettate per una faccenda diversa.

## Come funziona

- In **Aggiungi faccenda**, il campo titolo suggerisce
  **«Inserisci un titolo»** invece di una faccenda già esistente.
- Il selettore **Icona personale** offre **18 simboli astratti**:
  scintilla, stella, cuore, fiore, sole, luna, orologio, bandierina,
  segnalibro, etichetta, nastro, campanella, lampadina, bersaglio,
  onda, spunta, cerchio e piuma.
- Ogni simbolo ha lo stesso fondo crema e la stessa famiglia cromatica
  avorio/rosa antico/verde oliva; senza riferimenti a oggetti per pulire
  o stanze già rappresentate nel catalogo.
- Il predefinito per una nuova faccenda è **Scintilla**.
- In **Modifica faccenda** si può scegliere un simbolo personale.
  Le faccende già esistenti **mantengono il proprio disegno** finché
  non se ne seleziona uno diverso (anche se era uno dei preset).
- Le icone sono definite in `public/personal-icons/symbols.svg`,
  un unico sprite SVG vettoriale. Gli ID `personale-*` sono distinti da
  quelli dello Store, senza duplicare file WebP o dover eseguire download.
- La selezione è persistita nello stesso campo `icon` delle faccende;
  non modifica la struttura dei dati né crea nuove dipendenze.
- Il file di anteprima `public/personal-icons/preview.html` consente
  di vedere la libreria completa prima di ulteriori iterazioni.

## Futuro

I set di illustrazioni faccende possono continuare a essere venduti o
distribuiti nello Store indipendentemente dal set personale. Se in futuro
aggiungiamo nuovi stili, potremo applicare le loro palette senza cambiare
gli ID delle icone e perdere associazioni già salvate.
