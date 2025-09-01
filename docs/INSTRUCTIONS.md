# 📄 INSTRUCTIONS.md – Lecce Digital Community Game

## Visione generale

L’applicazione è una **PWA**, con interfaccia in stile **retro 8-bit (NES.css)**.
Il progetto ha lo scopo di creare un **gioco interattivo a missioni** (in stile caccia al tesoro / retro-RPG) che unisca **networking**, **multidisciplinarità** e **coinvolgimento social**.

L’utente esplora una **mappa interattiva** e sblocca progressivamente diverse **challenge**. Ogni passaggio tra la mappa e le challenge prevede un effetto **dissolvenza retro in stile Super Mario**.

---

## Requisiti funzionali

### Profilo utente

- Caricamento avatar in **pixel-art** dal sito https://www.avatarsinpixels.com/. In alternativa l'utente può scegliere tra un set di avatar preimpostati. L'immagine dell'avatar caricato o scelto viene salvato in base64.
- Possibilità di assegnare un **nome personalizzato**.
- QR personale e accesso rapido: dopo la creazione del profilo generare e mostrare immediatamente il QR-code personale (contenente `userId`, `displayName`, `avatarUrl`, `timestamp`) e rendere l'accesso al QR sempre semplice e visibile:
  - Mostrare un modal di conferma al termine della creazione profilo con bottone primario "Mostra il mio QR".
  - Aggiungere un'azione rapida persistente nell'HUD (es. FAB con icona QR) visibile nelle schermate principali che apre la vista fullscreen del QR.
  - Nella pagina `Profile` inserire un bottone prominente "Mostra il mio QR" e una preview ridotta (avatar + nome) che apre il fullscreen QR al tap.
  - La vista fullscreen del QR mostra anche avatar, displayName e pulsanti secondari: "Scarica immagine", "Copia dati" (JSON) e "Chiudi". Non abilitare upload o condivisione automatica verso server remoti.
  - Generazione QR client-side (lib: qrcode o equivalente) e caching locale dell'immagine DataURL per uso offline.
-
- Nessuna autenticazione richiesta:
  - L'id utente viene ricevuto all'interno dell'URL come query parameter nel redirect dell'applicazione ufficiale del DevFest.
  - L’utente resta identificato tramite **localStorage**.

### Gestione stato e persistenza

- Stato gestito con uno store reattivo (es. observable / stream o equivalente).
- Persistenza su **localStorage** per dati e progressi utente.
- Firestore opzionale (default: disabilitato): l'app funziona in modalità locale-first e mantiene tutti i dati locali (`localStorage` e coda locale) per impostazione predefinita. Firestore o altri remote store possono essere attivati tramite configurazione in `game-data.json` usando il campo top-level `remoteBackend` (boolean, default `false`). L'upload di immagini rimane disabilitato per default. Conferma: nessuna immagine verrà salvata in remoto a meno che l'operatore non abiliti esplicitamente il backend remoto nella configurazione.

### UI/UX

- Stile coerente in tutto il progetto tramite **NES.css** e **NES.icon**.
- Layout delle challenge uniforme per garantire consistenza visiva e semplicità di sviluppo.
- Effetto **dissolvenza retro** per transizioni mappa ↔ challenge.
- Navigazione semplice e intuitiva, ottimizzata per mobile.

### Sincronizzazione stato ottenimento badge

- Al caricamento dell'applicazione verrà chiamata l'api del DevFest per ottenere i dati del badge corrispondente (id, descrizione, nome, immagine).
- Al completamento del gioco viene chiamata l'api del DevFest per comunicare l'ottenimento del badge tramite id utente, id badge e nuovo stato.

---

## Palette colori

La palette ufficiale del gioco è derivata dal logo della community e va applicata all’interfaccia:

Definiamo variabili CSS globali e due varianti tema (`dark` e `high-contrast`). Le variabili vanno inserite in `src/styles.scss` (sotto `:root`) e override nelle classi di tema (`.ldc-theme--dark`, `.ldc-theme--high-contrast`). Esempio di set di variabili da utilizzare:

```css
:root {
	--ldc-background: #f7f7f7;
	--ldc-surface: #000000;
	--ldc-on-background: #000000;
	--ldc-on-surface: #f7f7f7;

	--ldc-primary: #86257b;
	--ldc-secondary: #442c80;
	--ldc-accent: #c93880;
	--ldc-error: #ff3366;

	--ldc-border: rgba(0, 0, 0, 0.12);
	--ldc-focus: #c93880; /* fallback, usare color-mix se supportato */

	--ldc-transition-fast: 240ms;
	--ldc-transition-medium: 420ms;
	--ldc-transition-slow: 680ms;
}

/* Dark theme overrides */
.ldc-theme--dark {
	--ldc-background: #0b0b0b;
	--ldc-surface: #111111;
	--ldc-on-background: #f7f7f7;
	--ldc-on-surface: #f7f7f7;
	--ldc-border: rgba(255, 255, 255, 0.06);
}

/* High-contrast theme */
.ldc-theme--high-contrast {
	--ldc-background: #ffffff;
	--ldc-surface: #000000;
	--ldc-on-background: #000000;
	--ldc-on-surface: #ffffff;
	--ldc-primary: #6b1d61; /* più scuro per maggiore contrasto */
	--ldc-accent: #ff4f91; /* evidenza più vivida */
	--ldc-border: #000000;
}
```

Mappatura ruoli UI (regole d'uso rapide):

- Background pagina: `--ldc-background`.
- Superfici (card, pannelli, HUD): `--ldc-surface` con testo `--ldc-on-surface`.
- Azione primaria (bottoni principali): sfondo `--ldc-primary`, testo `--ldc-on-surface`.
- Azione secondaria: `--ldc-secondary` / `--ldc-on-surface`.
- Evidenze / badge: `--ldc-accent`.
- Errori: `--ldc-error`.
- Bordi/linee: `--ldc-border`.
- Focus: `--ldc-focus` (usare outline 2px o box-shadow sottile).

Regole pratiche e accessibilità:

- Verificare contrasto minimo 4.5:1 per testo normale; per testi piccoli mirare a contrasto superiore.
- Se un'etichetta testuale è sovrapposta a immagini di sfondo della mappa, inserire uno sfondo semi-opaquo (es. `rgba(0,0,0,0.6)`) per garantire leggibilità.
- Fornire la classe `.ldc-theme--high-contrast` per utenti che richiedono maggiore leggibilità.
- Limitare filtri CSS sulle sprite pixel-art: non applicare gradienti o colorize che alterino la palette originale degli asset.

Implementazione e note:

- Inserire le variabili in `src/styles.scss` e caricare `NES.css` come base; sovrascrivere solo i token necessari tramite le variabili sopra.
- Usare le variabili anche per definire helper e component classes (es. `.ldc-btn--primary { background: var(--ldc-primary); color: var(--ldc-on-surface); }`).
- Aggiungere uno script di controllo accessibilità (Lighthouse o script che verifichi i rapporti di contrasto) nella pipeline CI per evitare regressioni di contrasto.

Note su immagini e avatar:

- Per ora non si usa base64 per le immagini remote: gli avatar saranno scelti da una collection di preset (file statici in `public/assets/avatars/`) e serviti con un meccanismo di ottimizzazione immagine lato client/server appropriato.
- Quando si renderizzano immagini pixel-art, evitare scaling non intero (usare nearest-neighbor quando possibile) per preservare il look 8-bit.

Questa sezione fornisce regole pratiche che vanno applicate in tutto il progetto per garantire coerenza visiva e accessibilità.

---

## Struttura del gioco

### Mappa interattiva

- La mappa viene generata automaticamente sulla base delle istruzioni presenti in `game-data.json`.
- Ogni livello ha coordinate predefinite e viene rappresentato come tap-point.
- Lo stile della mappa deve richiamare un’ambientazione fantasy-medievale in pixel-art: boschi, grotte, castelli, montagne, teschi e altri simboli tematici.
- L’**avatar dell’utente** (in pixel-art) viene usato come **marker**:
  - Quando una challenge è completata, l’avatar si muove lungo il percorso fino al livello successivo.
  - Il movimento deve seguire il tracciato della mappa o, se non disponibile, una linea diretta tra i livelli.
  - Il movimento deve avvenire con animazioni step-by-step in stile 8-bit.
  - All’arrivo a un livello, viene attivata la challenge corrispondente.

Dettagli tecnici per la mappa e contratto `game-data.json`:

- Coordinate e unità:

- Usare coordinate su una griglia discreta (tile grid) con valori interi { x: number, y: number } dove x/y rappresentano colonne/righe della griglia.
- Fornire opzionalmente `pixelPosition: { x: number, y: number }` per nodi che richiedono posizionamento preciso rispetto all'immagine di sfondo.
- Definire `gridSize` (es. 32px) nel file `game-data.json` per convertire coordinate di griglia in pixel quando necessario.

- Nodes (nodi/levels):

- Ogni nodo definito come (esempio JSON):

#### Networking Forest — purpose

Scopo: scansione dei QR-code personali di altri partecipanti per ottenere scansioni distinte e sbloccare progressione sulla mappa.

Per la specifica completa (UX flow, tipi, persistenza, acceptance criteria) vedere [docs/challenges/networking-forest.md](docs/challenges/networking-forest.md).

#### Retro Puzzle — purpose

Scopo: gioco di matching parola→categoria in una singola schermata (mobile-first) che l'utente completa per sbloccare progressione sulla mappa.

Per la specifica completa (UX, tipi, persistenza, acceptance criteria) vedere [docs/challenges/retro-puzzle.md](docs/challenges/retro-puzzle.md).

#### Debug Dungeon — purpose

Scopo: quiz multidisciplinare con domande caricate dal `game-data.json` (mcq e multi) per valutare conoscenze e sbloccare la progressione.

Per la specifica completa (UX, tipi, persistenza, acceptance criteria) vedere [docs/challenges/debug-dungeon.md](docs/challenges/debug-dungeon.md).

#### Social Arena — purpose

Scopo: raccolta di una proof (screenshot/post) contenente il tag della community; la verifica avviene client-side via OCR e, se valida, la challenge può essere marcata completata.

Per la specifica completa (UX, tipi, persistenza, acceptance criteria) vedere [docs/challenges/social-arena.md](docs/challenges/social-arena.md).

<!-- Final Memory Game rimosso: non più incluso nel set di challenge -->

---

## Requisiti non funzionali

- **Performance:**
  - Caricamento rapido, animazioni fluide.
- **Accessibilità:**
  - Contrasto, navigazione da tastiera, high-contrast mode.
- **Offline-first:**
  - Tutte le funzionalità disponibili senza connessione.
- **Sicurezza:**
  - Nessun dato sensibile trasmesso senza consenso.

---

## Task e attività

| Task                              | Status | Assegnato | Priorità | Descrizione                                                                          |
| --------------------------------- | ------ | --------- | -------- | ------------------------------------------------------------------------------------ |
| Profile & QR                      | To Do  | CA        | Alta     | UI per avatar picker, displayName, QR generation, modal, FAB, cache DataURL.         |
| Store reattivo + Persister locale | To Do  | CA        | Alta     | Implementare store reattivo e persister per localStorage keys (framework-agnostico). |
| Map loader                        | To Do  | CA        | Alta     | Parse game-data.json, render grid, marker clickable.                                 |
| Networking Forest                 | To Do  | CA        | Alta     | Scanner view, preview modal, persist scans.                                          |
| Retro Puzzle                      | To Do  | CA        | Alta     | Matching UI, scoring, persist state.                                                 |
| Debug Dungeon                     | To Do  | CA        | Alta     | Quiz lifecycle, scoring, persist.                                                    |
| IntroScreen (Retro Reveal)        | To Do  | CA/UX     | Alta     | IntroScreen (UI unit): pixel-art image + progressive blurb reveal, tap-to-start.     |
| Modal styling (retro)             | To Do  | UX/CA     | Alta     | Apply `.ldc-modal--retro` styles and ensure accessibility (focus trap, ARIA).        |
| PhotoRetroTransformer utility     | To Do  | CA        | Media    | TS util to pixelate/ posterize photos for preview while keeping raw for OCR.         |
| 8-bit audio + sound manager       | To Do  | CA/UX     | Media    | Small set of 8-bit cues (start, success, error) with mute toggle.                    |
| Pixel assets (intro/set)          | To Do  | HD        | Media    | Create pixel-art assets for challenge intros and badges (1x/2x).                     |
| Social Arena                      | To Do  | CA        | Alta     | Upload screenshot, OCR client-side, save proof.                                      |
| Badge API mock + sync hooks       | To Do  | CA        | Media    | Mock API, invoke on completion.                                                      |
| Theme variables                   | To Do  | HD/CA     | Media    | Apply CSS variables, NES.css baseline.                                               |
| Build & smoke                     | To Do  | CA        | Bassa    | Build PWA, quick test, README.                                                       |
