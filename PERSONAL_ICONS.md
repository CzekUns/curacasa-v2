# CuraCasa — Libreria icone personali

## Scopo

Le icone dei **preset dello Store** rappresentano faccende specifiche
(aspirapolvere, bagno, condizionatore, ecc.) e restano riservate ai preset.

Chi crea una faccenda personalizzata deve poter scegliere un simbolo **neutro**
e non rischiare di usare immagini progettate per una faccenda diversa.

## Come funziona

- In **Aggiungi faccenda**, il campo titolo suggerisce
  **«Inserisci un titolo»** invece di una faccenda già esistente.
- Il selettore **Icona personale** offre **42 simboli**, divisi in due sezioni. La prima contiene **24 icone a tema pulizie**, tutte nello stesso stile vettoriale crema/salvia/rosa antico: goccia, bolle, schiuma, spruzzo, spugna, panno, guanto, saponetta, spazzolina, secchiello, piumino, detergente, vetro lucido, riciclo, profumo, aria fresca, polvere, asciutto, lavaggio, microfibra, superficie lucida, flacone, tergivetro e movimento. La seconda contiene i **18 simboli astratti originali**:
  scintilla, stella, cuore, fiore, sole, luna, orologio, bandierina,
  segnalibro, etichetta, nastro, campanella, lampadina, bersaglio,
  onda, spunta, cerchio e piuma.
- Ogni simbolo ha lo stesso fondo crema e la stessa famiglia cromatica
  avorio/rosa antico/verde oliva; con disegni nuovi, stilizzati e riconoscibili, senza riutilizzare
  i file illustrati delle faccende dello Store.
- Il predefinito per una nuova faccenda è **Scintilla**.
- In **Modifica faccenda** si può scegliere un simbolo personale.
  Le faccende già esistenti **mantengono il proprio disegno** finché
  non se ne seleziona uno diverso (anche se era uno dei preset).
- Le icone sono definite in `public/personal-icons/symbols.svg`,
  un unico sprite SVG vettoriale. I primi 18 disegni e i loro ID non sono stati alterati. Gli ID `personale-*` sono distinti da
  quelli dello Store, senza duplicare file WebP o dover eseguire download.
- La selezione è persistita nello stesso campo `icon` delle faccende;
  non modifica la struttura dei dati né crea nuove dipendenze.
- Il file di anteprima `public/personal-icons/preview.html` consente
  di vedere tutti i 42 simboli, suddivisi per categoria, prima di ulteriori iterazioni.

## Futuro

I set di illustrazioni faccende possono continuare a essere venduti o
distribuiti nello Store indipendentemente dal set personale. Se in futuro
aggiungiamo nuovi stili, potremo applicare le loro palette senza cambiare
gli ID delle icone e perdere associazioni già salvate.
