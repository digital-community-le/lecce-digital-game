# UI/UX Specs – Lecce Digital Community Game

## Visione generale

L'interfaccia utente deve incarnare uno stile **retro 8-bit (NES.css)**, ispirato a giochi classici come Super Mario, con elementi pixel-art e transizioni in dissolvenza. Il design è **mobile-first**, ottimizzato per dispositivi touch, con navigazione intuitiva e layout uniforme per garantire coerenza visiva.

Obiettivo: creare un'esperienza immersiva e coinvolgente che promuova networking, multidisciplinarità e coinvolgimento social, mantenendo semplicità e accessibilità.

## Tipografia

Regole tipografiche principali:

- Font per i titoli: `Press Start 2P` (display, monospaced retro) — usare esclusivamente per titoli, badge retro e elementi decorativi dove lo spazio è limitato.
- Font per il body e UI: `Nunito` — leggibile, arrotondato, adatto per testi lunghi, form, label e microcopy.

- Font per i bottoni: `Press Start 2P` — utilizzare `Press Start 2P` per le etichette dei pulsanti primari/secondari per coerenza stilistica 8‑bit; limitare a etichette brevi (max 4–6 parole). Garantire fallback a `Nunito` se il font non è disponibile e verificare contrasto/accessibilità per casi a basso contrasto.

Import consigliato (es. in `index.html` o `src/styles.scss`):

````css
@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;800&family=Press+Start+2P&display=swap");

:root {
	--ldc-font-title: "Press Start 2P", cursive;
	--ldc-font-body: "Nunito", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue",
		Arial;
}

h1,
h2,
h3,
.ldc-title {
	font-family: var(--ldc-font-title);
	/* usare solo per headline brevi */
	letter-spacing: 0.02em;
}

body,
input,
button,
select,

# UI/UX Specs – Lecce Digital Community Game

## Visione generale

L'interfaccia utente deve incarnare uno stile retro 8‑bit (NES.css), mobile‑first e ottimizzata per dispositivi touch. Obiettivo: esperienza coerente, accessibile e performante che faciliti networking e coinvolgimento social.

---

## Indice rapido

- Tipografia
- Palette & temi
- Componenti principali (Header, FAB, Modal, Toast, Profile)
- Layout e breakpoints
- Interazioni e animazioni
- Accessibilità
- Flussi principali
- Requisiti tecnici e acceptance criteria

---

## Tipografia

Principi:
- Titoli / elementi decorativi: `Press Start 2P` (display retro).
- Corpo / UI: `Nunito` (leggibile per form, label e microcopy).
- Bottoni: usare `Press Start 2P` per le label dei pulsanti primari/secondari per coerenza stilistica 8‑bit; limitare a etichette brevi (max 4–6 parole). Per pulsanti con etichette lunghe usare `Nunito`.
- Fallback: se `Press Start 2P` non è disponibile usare `Nunito`; per robustezza fornire fallback di sistema in `--ldc-font-body`.
- Caricamento: usare `preconnect` a fonts.googleapis.com e `display=swap`.
# UI/UX Specs – Lecce Digital Community Game

## Visione generale

L'interfaccia utente deve incarnare uno stile retro 8‑bit (NES.css), mobile‑first e ottimizzata per dispositivi touch. Obiettivo: esperienza coerente, accessibile e performante che faciliti networking e coinvolgimento social.

---

## Indice rapido

- Tipografia
- Palette & temi
- Componenti principali (Header, FAB, Modal, Toast, Profile)
- Challenge specifiche
- Gamification e Feedback
- Layout e breakpoints
- Interazioni e animazioni
- Accessibilità
- Flussi principali
- Requisiti tecnici e acceptance criteria

---

## Tipografia

Principi:
- Titoli / elementi decorativi: `Press Start 2P` (display retro).
- Corpo / UI: `Nunito` (leggibile per form, label e microcopy).
- Bottoni: usare `Press Start 2P` per le label dei pulsanti primari/secondari per coerenza stilistica 8‑bit; limitare a etichette brevi (max 4–6 parole). Per pulsanti con etichette lunghe usare `Nunito`.
- Fallback: se `Press Start 2P` non è disponibile usare `Nunito`; per robustezza fornire fallback di sistema in `--ldc-font-body`.
- Caricamento: usare `preconnect` a fonts.googleapis.com e `display=swap`.

Snippet di import consigliato:

```css
@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;800&family=Press+Start+2P&display=swap");
:root {
	--ldc-font-title: 'Press Start 2P', cursive;
	--ldc-font-body: 'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
}
````

Linee guida pratiche:

- Non usare `Press Start 2P` per paragrafi o etichette lunghe.
- Controllare letter-spacing e line-height quando si applica il font per evitare sovraffollamento.

---

## Palette & temi

Di seguito i token CSS principali (definiti in `:root` in `src/styles.css`) con i valori consigliati; usare sempre i token invece di colori hardcoded.

```css
:root {
	/* Backgrounds & surfaces */
	--ldc-background: #e0e0e0; /* pagina - neutro chiaro */
	--ldc-surface: #ffffff; /* card, pannelli, overlay */
	--ldc-on-background: #000000; /* testo su background */
	--ldc-on-surface: #000000; /* testo su superfici */

	/* Primary family */
	--ldc-primary: #bd1f76; /* primario */
	--ldc-primary-light: #f28da3; /* highlight */
	--ldc-primary-dark: #7a144d; /* ombra */

	/* Accents & complements */
	--ldc-contrast-yellow: #f2c641;
	--ldc-accent-blue: #41a6f2;
	--ldc-rpg-green: #2f8c2f; /* success */
	--ldc-accent-orange: #f25d27;

	/* Semantic */
	--ldc-secondary: var(--ldc-accent-blue);
	--ldc-accent: var(--ldc-accent-orange);
	--ldc-success: var(--ldc-rpg-green);
	--ldc-error: #ff3366;
	--ldc-neutral: var(--ldc-background);

	--ldc-border: rgba(0, 0, 0, 0.12);
	--ldc-focus: var(--ldc-primary);

	--ldc-transition-fast: 240ms;
	--ldc-transition-medium: 420ms;
	--ldc-transition-slow: 680ms;
}
```

Uso rapido e mapping delle regole:

- Background pagina: `--ldc-background`.
- Superfici (card, pannelli, overlay): `--ldc-surface` con testo `--ldc-on-surface`.
- Azione primaria (bottoni principali): sfondo `--ldc-primary`, testo `--ldc-on-surface`.
  - Quando possibile usare `--ldc-primary-dark` per inset/shadow e `--ldc-primary-light` per highlights.
- Azione secondaria: `--ldc-secondary` / `--ldc-on-surface`.
- Evidenze / badge: `--ldc-accent` (arancione) o `--ldc-accent-blue` per azioni secondarie.
- Success/state positivo: `--ldc-success`.
- Error: `--ldc-error`.

Temi supportati (applicare la classe su `<html>`):

- `.ldc-theme--default` — palette base come sopra.
- `.ldc-theme--dark` — sostituire token principali per varianti scure (es. `--ldc-background: #071013`, `--ldc-foreground: #e6eef0`).
- `.ldc-theme--high-contrast` — usare combinazioni ad alto contrasto (es. `--ldc-background: #000`, `--ldc-foreground: #fff`, `--ldc-accent: #ffff00`).

Regole pratiche:

- Usare i token per tutti i colori, evitare `#hex` direttamente nel CSS dei componenti.
- Non sovrascrivere le proprietà strutturali di NES.css (borders, inset styles); mappare soltanto i colori tramite variabili.
- Per i pulsanti NES: mappare `.nes-btn.is-primary` su `--ldc-primary` e le varianti `.is-success/.is-warning/.is-error` ai token corrispondenti.

Accessibilità colore:

- Garantire contrast ratio minimo 4.5:1 per testi normali e 7:1 per testi piccoli. Per i casi borderline, preferire il tema high-contrast o aumentare peso/fonte.
- Test automatici consigliati: axe-core, Lighthouse; eseguire controlli su componenti critici (header, bottoni, modali).

---

## Componenti principali

Nota: preferire markup NES.css + classi di utilità locali per colori e spacing. Non sovrascrivere stili globali di NES.css; limitare override a colori e token.

### Header / HUD

- Altezza: `--ldc-header-height: 48px`.
- Layout: logo a sinistra (32×32), titolo/crumb opzionale al centro (desktop), gruppo azioni a destra (social, theme toggle, profile/FAB indicator).
- Mobile: titolo centrale nascosto per risparmiare spazio (vedi regola `.ldc-header__title--mobile-hidden`).
- Accessibilità: ogni azione ha `aria-label`; social links con `rel="noopener noreferrer"` e `target="_blank"`.

### FAB (QR)

- Pulsante flottante per accesso rapido al QR personale.
- Dimensione minima tap target: 44×44px.
- Visual: usare classi NES (`nes-btn`) e applicare token colore.

### Modal / Overlay (confirm, QR preview)

- Fornire focus trap (focus management) e chiusura con ESC.
- Backdrop: semi-opaco con `aria-modal="true"` e `role="dialog"`.
- Contenuto: avatar, nome, timestamp, pulsanti scarica/copia/chiudi.

### Toast

- Non-blocking, `aria-live="polite"` o simile.
- Durata configurabile, includere variante successo/errore/info.

### Profile

- Form: displayName + avatar preset selection.
- Salvataggio: persist in localStorage con chiave `ldc:profile:{userId}`; ultima referenza `ldc:profile:last`.
- Dopo salvataggio: generare QR (lib: `qrcode`) e salvare `ldc:qr:{userId}`.

---

## Challenge specifiche

Ogni challenge è progettata come un modulo riusabile con contratti chiari (input, output, error modes). Di seguito le challenge iniziali e i loro requisiti UI/UX.

### Networking Forest

- Scanner: fullscreen camera con fallback import immagine.
- Preview modal: mostra avatar scansionato, nome, timestamp, pulsanti conferma/annulla.
- Lista players scansionati: griglia o lista scrollabile con avatar (64x64px) e username dei players unici scansionati, ordinati per timestamp decrescente.
- Progress: barra o contatore con conteggio scansioni distinte.
- Feedback: toast per success/error (es. self-scan bloccato), animazioni micro per successo.

### Retro Puzzle

- Layout: due colonne (termini a sinistra, categorie a destra) o adattivo per mobile.
- Interazione: tap-to-match, drag-and-drop opzionale per dispositivi con supporto.
- Feedback istantaneo: evidenza corretta/sbagliata, suono retro opzionale.
- Hint: pulsante opzionale con penalty (timeout o riduzione punti).
- Completion: summary score con badge e pulsante "Torna alla mappa".

### Debug Dungeon

- Quiz: domanda singola con scelte multiple, timeout configurabile.
- Feedback: risposta valutata con spiegazione opzionale; evidenza corretto/errato.
- Risultati: punteggio finale, calcolo percentuale, pass/fail basato su `passThresholdPercent`.

### Social Arena

- Upload: file input per screenshot/post con preview e picker di tag.
- OCR preview: modal con detected tags (vedi `docs/tesseract-integration.md`), richiesta conferma prima dell'invio.
- Fallback: invio manuale se OCR fallisce.
- Istruzioni: microcopy che spiega come ottenere un buon risultato per la challenge (es. angolazione, luminosità).

---

## Gamification e Feedback

Principi di gamification usati per incentivare partecipazione e retention:

- Progressione visiva: stelle o badge per challenge completate, mostrati nel HUD e nella pagina profilo.
- Rewards immediati: animazioni celebrative (particelle pixel, confetti) per completamenti; usare micro-animazioni con reduced-motion support.
- Leaderboard soft: sezione statistiche con confronti anonimi (es. percentile), opt-in per la condivisione dei dati.(opzionale, solo con sincronizzazione abilitata)
- Achievements: popup/modal per milestone (es. "Primo networking!", "Puzzle master"); prevedere storage locale e sincronizzazione opzionale.

Feedback in tempo reale:

- Vibrazione: usare `navigator.vibrate` su mobile per eventi importanti (success/error), con toggle nelle impostazioni.
- Micro-animazioni: highlight su elementi interattivi, pulse per call-to-action, shake per errori.
- Stati loading: spinner NES.css o skeleton per operazioni asincrone.
- Error handling: messaggi user-friendly con azioni suggerite (es. "Riprova", "Continua offline").

Metriche di successo (esempio):

- Completion rate per challenge (>90% target).
- Time-to-complete medio per challenge (monitorare regressioni).
- Engagement: daily active users che usano almeno una challenge.

---

## Layout & breakpoints

Breakpoints consigliati (mobile-first):

- small: 320px+
- tablet: 768px
- desktop: 1024px+

Container principale:

- `main` max-width: 720px (desktop 980px).
- Padding interno: 1rem (desktop 1.5rem).
- Evitare overflow-x; forzare `box-sizing: border-box` globalmente.

---

## Interazioni e animazioni

- Preferire step animations e `transform: scale()` per effetto 8‑bit (no easing sofisticati).
- Transitions rapido: `--ldc-transition-fast: 240ms`, medium: `420ms`.
- Ridurre motion per accessibilità (supportare `prefers-reduced-motion`).

---

## Accessibilità (consolidata)

Requisiti principali:

- Keyboard: navigazione completa, focus order logico, focus trap nelle modal.
- Screen reader: usare `aria-label`, `role` e `aria-live` dove opportuno.
- Contrast: 4.5:1 normale, 7:1 per testi piccoli.
- Tap targets: min 44×44px.
- Color blindness: evitare dipendere solo dal colore per significati.
- Audit: integrare axe-core in CI per rilevazioni automatiche.

---

## Flussi principali

### Onboarding / Profile

1. Ricezione userId via query param.
2. Creazione profilo: nome + avatar preset.
3. Conferma -> generazione QR -> salvataggio profile e QR.
4. Accesso rapido via FAB.

### Intro Screen (pre-challenge)

- Fullscreen, immagine pixel-art centrata, blurb rivelato progressivamente.
- Tap dopo reveal avvia `challenge:start` e salva `startedAt` in `ldc:progress:{userId}`.
- Timing suggerito: charDelay ~18ms, completeDelayAfterTap ~160ms.

---

## Requisiti tecnici UI/UX

- Styling: NES.css + NES.icon; token CSS in `src/styles.css`.
- Performance: lazy-load per feature pesanti; image optimization (1x/2x), use `image-rendering: pixelated` for pixel-art.
- Tests: componenti isolabili per unit tests; Storybook consigliato.
- PWA: manifest e service worker per caching e offline.

---

## Acceptance criteria

- Responsive layout per breakpoints (320px+).
- Contrast/accessibilità rispettati (WCAG 2.1 AA).
- Transitions percepite veloci; reduced-motion support.
- Feedback chiaro e non-blocking.
- Performance: FCP <2s, TTI <3s (obiettivo).

---

## Note implementative e link utili

- Store keys: `ldc:profile:{userId}`, `ldc:qr:{userId}`, `ldc:profile:last`.
- Token CSS: `--ldc-header-height`, `--ldc-primary`, `--ldc-focus`.
- Vedi anche: `docs/tasks-board.md`, `docs/game-story.md`, `docs/challenges-specs.md` per dettagli challenge-specifici.

### UX per performance

- **Skeleton loading**: placeholder durante caricamenti per evitare layout shift.
- **Progressive enhancement**: funzionalità core funzionanti anche con JS disabilitato.
- **Battery awareness**: ridurre animazioni su batteria bassa, notifiche smart.
- **Network awareness**: adattare qualità media (es. immagini più piccole su 3G).

### Flusso di completion (nuovo)

- Quando un player completa una challenge, viene mostrato un modal celebrativo fullscreen che comunica la conquista della gemma.
- Il modal è bloccante (aria-modal, focus trap) e contiene: immagine della gemma, titolo celebrativo, messaggio di descrizione e un singolo pulsante CTA con label "Continua l'avventura".
- All'apertura del modal la UI può mostrare micro-animazioni (particelle pixel, glow) rispettando `prefers-reduced-motion`.
- Quando l'utente preme "Continua l'avventura" il modal si chiude e l'app esegue un redirect verso la mappa di gioco (route `/map` o equivalente), senza avviare animazioni avatar aggiuntive in linea se non esplicitamente richieste.
- Il modal deve essere accessibile da tastiera (invio/space per attivare il CTA) e chiudibile con ESC come fallback, con comportamento pari al pulsante (redirect alla mappa).

Nota implementativa: il flusso replace il precedente comportamento dove il pulsante poteva semplicemente chiudere il dialog e lasciare l'utente sulla challenge; ora il destino primario è tornare alla mappa per favorire continuità di esplorazione.

---

## Acceptance criteria UI/UX

- Layout uniforme e responsive su dispositivi target (320px+), con supporto landscape.
- Contrasto e accessibilità rispettati (Lighthouse score >90, WCAG 2.1 AA).
- Transizioni smooth (<100ms perceived lag), con reduced motion support.
- Feedback visivo chiaro per ogni azione, con haptic/audio cues.
- Stile retro coerente, con pixel-perfect alignment.
- Performance: First Contentful Paint <2s, Time to Interactive <3s.
- Usabilità: task completion rate >95%, error rate <5%.
- Accessibilità: navigazione completa da tastiera, screen reader support.
