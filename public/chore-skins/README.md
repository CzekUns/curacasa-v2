# Skin grafiche CuraCasa

Cinque set alternativi per le 12 faccende essenziali (`base-essenziali`), ciascuno con 12 WebP e manifest.

- **Vintage60**: illustrazioni mid-century.
- **Vintage80**: pop-art e Memphis.
- **Ink30**: cartoon in bianco e nero.
- **ClayToon**: plastilina / stop motion.
- **ChibiCasa**: kawaii originale.

Selezionabili nello Shop, separati dai temi colore. L'originale resta sempre disponibile e le faccende non vengono modificate. **Toon50/Vintage50** è escluso (da rifare).

## Sfondo e inquadratura

- **Vintage60** usa ora un fondo bianco opaco nelle dodici immagini WebP.
- Le altre skin mantengono i loro sfondi originali, ma vengono mostrate
  a **46 × 46 px** all'interno delle cornici da **48 × 48 px**: il colore
  arriva quasi a filo del bordo, senza sostituire la cornice rosa.
- Le immagini classiche e le icone personalizzate mantengono le
  dimensioni e la presentazione precedenti.

## Inquadratura delle skin

Le 60 WebP vengono normalizzate a 320 × 320 px: illustrazione ridotta al
**87%** della dimensione originale, con sfondo bianco esteso per **Vintage60**
e sfondo coerente con i colori originali per gli altri set. La cornice rosa
dell'app rimane un livello CSS in primo piano e non viene inclusa nei WebP.
La trasformazione è eseguita una sola volta e registrata nel file
`.subjects-padded-v1.json` per evitare ridimensionamenti ripetuti.

### ClayToon — recupero versione approvata

ClayToon è stato ripristinato alle 12 illustrazioni approvate prima del ridimensionamento globale: l'algoritmo aveva creato bordi fantasma e doppie cornici ai pannelli in plastilina. La cornice CSS rosa rimane sopra le icone. Gli altri quattro set conservano le loro modifiche. Una versione ClayToon con soggetti più piccoli richiede un vero intervento sullo sfondo e sugli oggetti, non il ridimensionamento dell'intera card.
