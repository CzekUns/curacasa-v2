# CuraCasa — Studio del marchio, versione 2026.10

## Direzione

L'identità scelta è il disegno della **casa con cuore, cerchio aperto e
ramoscello di ulivo** fornito come riferimento nel progetto. Evitare le
varianti generiche con tetti neri, foglie tridimensionali o forme troppo
geometriche: l'insieme deve restare caldo e artigianale.

**Messaggio:** la casa è il luogo delle abitudini; il cuore comunica cura; il
ramo porta serenità; il cerchio aperto suggerisce una routine che si rinnova.

## Modello scalabile, non semplice riduzione

| Formato | File vettoriale | Uso | Minimo suggerito |
| --- | --- | --- | --- |
| Completo | `mark.svg` | hero, brandbook, marketing | 72 px |
| Orizzontale | `logo.svg` | intestazioni, social, documenti | 180 px |
| Verticale | `logo-stacked.svg` | asset quadrati, social | 180 px |
| Compatto | `compact-mark.svg` | navbar, app, profili piccoli | 32 px |
| Favicon | `favicon.svg` | schede browser, bookmark | 16 px |
| PWA | `app-icon.svg` | icona installabile | 192 / 512 px |
| PWA maskable | `app-icon-maskable.svg` | Android adaptive | 512 px |
| Un solo colore | `mark-mono.svg` | stampa semplice | 72 px |
| Negativo | `mark-reverse.svg` | su fondo scuro pieno | 72 px |

A dimensioni ridotte si semplificano foglie e venature, si aumenta il
peso dei contorni e si usa una forma di cuore più evidente.

## Proporzioni e protezione

- Griglia primaria: 256 × 256 unità; disegno visivamente centrato.
- Cerchio volutamente aperto sul lato sinistro per accogliere il ramo.
- Evitare di chiudere il cerchio, spostare il ramo all'interno o usare più
  cuori nell'icona principale.
- Spazio di rispetto suggerito: circa 1/8 dell'altezza del simbolo su
  ciascun lato. Non allungare il logo.
- Gli sfondi restano avorio o chiari. Su superfici scure usare il
  marchio in negativo.

## Palette ufficiale

| Funzione | Nome | Colore |
| --- | --- | --- |
| Background | Avorio | `#FAF5EF` |
| Background | Rosa cipria | `#F5E5E1` |
| Background | Salvia chiaro | `#E6EEED` |
| Marchio | Terracotta | `#C58D6D` |
| Marchio | Verde oliva | `#65745D` |
| Testi principali | Verde scuro | `#263A34` |

## Tipografia

Montserrat per logo, pulsanti e navigazione; Playfair Display riservato
ai titoli editoriali già presenti nella PWA. Il logotipo CuraCasa mantiene
«Cura» oliva e «Casa» terracotta, senza effetti tridimensionali.

## Hero homepage

Il disegno `hero-whisper.svg` è **puramente decorativo** e non deve
contenere testo, link o dati della PWA. Sul sito è inserito con
`aria-hidden`, opacità **28% desktop** e **14% mobile**, e una
sfumatura laterale che preserva la leggibilità della CTA e dell'H1.

## Test e manutenzione

La pagina live `/brand/studio.html` mostra l'intera famiglia, compresa
una prova 16, 32 e 40 px.

Il file `scripts/generate_brand_icons.py` rigenera PNG e ICO dagli SVG
sorgenti per evitare divergenze tra browser e schermo Home. La build deve
verificare dimensioni, formato e presenza degli asset.

Questo documento non cambia Clerk, pagamenti o dati delle faccende.
