# Specifiche Avatar selezionabili

Documento che descrive i 5 avatar selezionabili nell'app LDC (Lecce Digital Community).

## Scopo
Fornire una scheda tecnica e di design per ciascun avatar selezionabile dall'utente. Ogni scheda contiene: breve descrizione, personalità, palette di colori, testo alternativo/accessibilità, formati e dimensioni consigliate, casi d'uso e criteri di accettazione.

## Note e assunzioni
- Il progetto attuale contiene tre avatar (`avatar-1.svg`, `avatar-2.svg`, `avatar-3.svg`). Per completezza richiedo/assumo l'esistenza di `avatar-4.svg` e `avatar-5.svg` sotto `/assets/avatars/`.
- Se preferisci, posso adattare i nomi/descrizioni esistenti ai file reali o generare proposte visive. Conferma se preferisci che i nomi file siano differenti.

---

## Sommario rapido
| ID | Nome file (proposto) | Nome visualizzato | Breve descrizione |
|---:|---|---|---|
| A1 | `/assets/avatars/avatar-1.svg` | Aria | Avatar caldo e amichevole, colori pastello, adatto profili social | 
| A2 | `/assets/avatars/avatar-2.svg` | Marco | Avatar dinamico, look casual-tech, ideale per giocatori e contributor |
| A3 | `/assets/avatars/avatar-3.svg` | Nina | Avatar creativo, elementi pixel-art leggeri, adatto a designer e artisti |
| A4 | `/assets/avatars/avatar-4.svg` | Pixel | Avatar retro/pixel, stile nostalgico, per challenge retro |
| A5 | `/assets/avatars/avatar-5.svg` | Robo | Avatar robotico/minimale, ideale per bot, dev e profili tecnici |

---

## Scheda avatar (dettagli)

### Avatar A1 — Aria
- Nome file (suggerito): `/assets/avatars/avatar-1.svg`
- Breve descrizione: volto sorridente con tratti morbidi e palette pastello; comunica accoglienza e accessibilità.
- Personalità: amichevole, inclusiva, neutra rispetto al genere.
- Palette colore principale: #F6D1E6 (rosa chiaro), #BD1F76 (magenta primario), #FFFFFF (bianco), #4A4A4A (grigio testo).
- Dimensioni consigliate: SVG scalabile; generare anche PNG 256x256 e 72x72 per fallback.
- Alt text consigliato: "Avatar Aria — volto sorridente, stile illustrato".
- ARIA/UX: pulsante selezione deve avere `aria-label="Seleziona avatar Aria"` e stato selezionato visibile via outline e `aria-pressed` vero/falso.
- Casi d'uso: profili generici, onboarding, fallback avatar.
- Criteri di accettazione:
  - SVG corrisponde all'immagine approvata e mantiene qualità a 72–512px.
  - Contrasto tra elementi attivi e sfondo >= 3:1 se usato come elemento interattivo.
  - Test accessibilità: selezionabile via tastiera e annunciatore vocale legge l'alt/label.

### Avatar A2 — Marco
- Nome file: `/assets/avatars/avatar-2.svg`
- Breve descrizione: figura con cappello/ciuffo, stile moderno e pulito.
- Personalità: energico, curioso, adatto a utenti attivi nella community.
- Palette: #2D9CDB (azzurro), #0F172A (navy scuro), #F8FAFC (quasi bianco).
- Alt text: "Avatar Marco — figura giovane con ciuffo, stile moderno".
- Formati: SVG + PNG 256x256.
- Interazioni: outline di selezione con `outline: 3px solid var(--ldc-primary)`.
- Criteri di accettazione: come A1; immagine leggibile a piccole dimensioni e senza dettagli critici persi.

### Avatar A3 — Nina
- Nome file: `/assets/avatars/avatar-3.svg`
- Breve descrizione: tratto più creativo, magari occhiali o accessorio, colori vivaci.
- Personalità: creativa, espressiva, adatta a ruoli artistici e designer.
- Palette: #FFC857 (giallo), #119DA4 (teal), #4A4A4A (grigio testo).
- Alt text: "Avatar Nina — volto con accessorio creativo".
- Formati: SVG + PNG 256x256, ottimizzazione per contrasto dei dettagli.
- Criteri: leggibilità, contrasto e accessibilità come A1.

### Avatar A4 — Pixel
- Nome file (proposto): `/assets/avatars/avatar-4.svg`
- Breve descrizione: stile pixel-art, reminiscenze retro gaming, forme semplificate.
- Personalità: nostalgico, giocoso, adatto a challenge rétro.
- Palette: palette ridotta es. #000000, #FFFFFF, #FF6B6B, #4ECDC4.
- Alt text: "Avatar Pixel — icona in stile pixel art".
- Formati: SVG (preferito) + PNG 128x128 e 64x64 per icone.
- Note tecniche: mantenere griglia pixel-aligned; evitare anti-aliasing che sfumi i pixel.
- Criteri di accettazione: mantiene la griglia visibile a 64–128px; non introdurre sfumature non volute.

### Avatar A5 — Robo
- Nome file (proposto): `/assets/avatars/avatar-5.svg`
- Breve descrizione: avatar robotico/minimale, linee pulite e dettagli geometrici.
- Personalità: efficiente, tecnico, ideale per profili dev/bot.
- Palette: #0B3D91 (blu profondo), #A7C9FF (azzurro chiaro), #E6EEF7.
- Alt text: "Avatar Robo — icona robot minimal".
- Formati: SVG + PNG 256x256.
- Animazioni (opzionale): micro-interazione on hover (es. tilt/scale 1.05) usando transform, preferibilmente via CSS per performance.
- Criteri di accettazione: animazione ridotta a preferenza degli utenti con motion-reduce; contrasto adeguato.

---

## Requisiti funzionali e non funzionali specifici per gli avatar
- Ogni avatar deve essere un file SVG ottimizzato (minificato, senza metadata inutili).
- Deve essere disponibile almeno un PNG di fallback per ogni avatar (256x256).
- I file devono avere `title` e `desc` interni (per screen reader) o fornire `alt` appropriato quando incorporati in `<img>`.
- Se usati come opzioni selezionabili, ogni avatar deve esporre stato selezionato via attributi ARIA e essere totalmente navigabile con tastiera.
- Ridurre animazioni per utenti che richiedono `prefers-reduced-motion`.

## Criteri di accettazione generali (Definition of Done)
- Avatar presenti nelle posizioni previste (`/assets/avatars/avatar-{1..5}.svg`).
- PNG fallback generato per ciascuno (256x256). 
- Le descrizioni/alt corrispondono a quanto indicato in questo documento.
- I controlli UI che permettono la selezione mostrano chiaramente lo stato selezionato e sono raggiungibili via tastiera.
- Test automatico/manuale che verifica la presenza dei file e che la selezione aggiorna `avatarDataUrl` nel profilo (se applicabile).

## Esempio metadati consigliati (per ogni avatar)
- id: string (es. "avatar-1")
- name: string (es. "Aria")
- file: string (es. "/assets/avatars/avatar-1.svg")
- description: string
- alt: string
- colors: array di hex
- tags: array (es. ["friendly","pastel","rounded"]) 
 
## Integrazione con il JSON di configurazione iniziale

I dati e i metadati degli avatar devono essere inclusi nel JSON iniziale di configurazione del gioco in modo che il loader all'avvio possa popolare dinamicamente il selettore di avatar e verificare la presenza dei file.

Posizione suggerita: `docs/game-data.example.json` (o il file di configurazione che viene caricato al bootstrap dell'app).

Esempio di struttura da inserire sotto una chiave `avatars` nel JSON di configurazione:

```json
"avatars": [
  {
    "id": "avatar-1",
    "name": "Aria",
    "file": "/assets/avatars/avatar-1.svg",
    "pngFallback": "/assets/avatars/avatar-1-256.png",
    "alt": "Avatar Aria — volto sorridente, stile illustrato",
    "colors": ["#F6D1E6","#BD1F76","#FFFFFF"],
    "tags": ["friendly","pastel","rounded"]
  },
  {
    "id": "avatar-2",
    "name": "Marco",
    "file": "/assets/avatars/avatar-2.svg",
    "pngFallback": "/assets/avatars/avatar-2-256.png",
    "alt": "Avatar Marco — figura giovane con ciuffo",
    "colors": ["#2D9CDB","#0F172A","#F8FAFC"],
    "tags": ["modern","casual"]
  }
  /* ...altri avatar... */
]
```

Requisiti operativi:
- Il loader di gioco deve leggere la lista `avatars` all'avvio e popolare il componente di selezione avatar.
- Se un riferimento punta a file non presenti in `/public/assets/avatars`, il processo di build o il runtime dovrebbe loggare un warning per permettere la correzione.
- I path devono essere relativi alla root pubblica (es. `/assets/avatars/...`) in modo che il runtime possa risolverli correttamente.
- Assicurarsi che per ogni entry sia definito `file` (SVG) e `pngFallback` (almeno 256x256) come fallback.

Test e controllo di qualità:
- Aggiornare `docs/game-data.example.json` con la sezione `avatars` e aggiungere un test che verifica la corrispondenza tra le voci del JSON e i file effettivi presenti in `public/assets/avatars`.
- Verificare che i `alt` e i `colors` siano presenti per supportare l'accessibilità e la presentazione coerente nel UI.
