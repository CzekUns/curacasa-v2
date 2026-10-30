# CuraCasa — Icone personali, versione minimal

La libreria delle faccende personalizzate comprende **42 SVG minimalisti**:
24 simboli a tema pulizie e 18 generici. Il tratto è intenzionalmente
semplice, ispirato alle prime icone approvate: stella, cuore, sole, fiore,
goccia, panno, sapone, spugna e altri simboli riconoscibili anche piccoli.

## Principi visivi

- **Un solo colore per disegno**, controllato da `currentColor`.
- Niente fondi incorporati nello sprite SVG, niente gradienti, dettagli
  complessi o ombre nel disegno.
- In ogni scheda faccenda il simbolo è centrato sulla **stessa tile 48 × 48 px**
  delle icone WebP dei preset, con fondo bianco; il pittogramma SVG ha la
  stessa area interna 40 × 40 px delle WebP.
- Le tre famiglie di tinte sono `--personal-rose`,
  `--personal-sage`, `--personal-accent`, definite per **ciascuna delle
  cinque palette** (Classico, Cipria, Giada, Ghiaccio e Corallo).
- L'identificativo dell'icona `personale-*` non cambia quando si applica
  una palette diversa. Tutte le faccende già salvate continuano a mostrare
  il simbolo associato.
- I preset mantengono le loro immagini dedicate WebP/SVG senza variazioni.

## Selezione nell'app

Il componente `PersonalIconPicker` occupa lo spazio di **un solo pulsante
56 × 56 px**. Al tocco compare un popup simile a una tastiera emoji:

- massimo 264 px di larghezza;
- sei simboli per riga, scorrimento interno limitato a 220 px;
- nessun titolo sotto le icone né sezioni ingombranti;
- tocchi un simbolo e il popup si richiude;
- clic fuori o Escape chiude il popup;
- i nomi rimangono disponibili con `aria-label` per tecnologie assistive.

Il campo **Titolo della faccenda** continua a funzionare normalmente.

## Anteprima e test

`public/personal-icons/preview.html` presenta le 42 forme senza nomi
visibili e permette di alternare le cinque palette per verificare
il cambio colore. I controlli automatici verificano che lo sprite resti
monocromatico, che non incorpori sfondi, e che il selettore rimanga compatto.

Non sono stati aggiunti servizi, dipendenze o database.
