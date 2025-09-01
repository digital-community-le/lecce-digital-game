# Task 15 — Pixel assets (intro / set) — Specifica per HD

Owner: HD
Priorità: Media
Stima: 1.5d

Obiettivo

Produrre gli asset pixel‑art necessari per l'esperienza retrò del gioco, con file 1x e 2x ottimizzati, sorgenti editabili e versioning coerente. Gli asset saranno usati nelle IntroScreen, nei badge/epilogo, nei frame per le foto stilizzate e nelle UI retro.

Consegne richieste

1. Intro images per ciascuna challenge

   - `challenge-networking-forest-intro.png` (1x: 320×320, 2x: 640×640)
   - `challenge-retro-puzzle-intro.png` (1x/2x)
   - `challenge-debug-dungeon-intro.png` (1x/2x)
   - `challenge-social-arena-intro.png` (1x/2x)
   - Note: versioni con e senza cornice (frame) trasparente.

2. Badge / epilogo

   - `badge-sigillo.png` (1x: 480×480, 2x: 960×960)
   - `badge-gem-alleanza.png`, `badge-gem-memoria.png`, `badge-gem-sapienza.png`, `badge-gem-comunita.png` (64×64 e 128×128)

3. Frame / cornici pixelate per preview foto

   - `frame-photo-1x.png` (frame trasparente 320×320)
   - `frame-photo-2x.png` (640×640)

4. Icon sprites e indicatori UI

   - Icone small (24×24 base grid) in PNG + SVG per fallback (es. `icon-start.png`, `icon-pause.png`, `icon-success.png`)
   - Badge small (32×32 / 64×64)

5. Particles / micro‑animazioni (opzionale ma preferibile)

   - Sequenza 3–6 frame PNG per effetto celebrativo (confetti pixel, sparkles)

6. Sorgenti e metadata
   - File sorgente editabile per ogni asset (Aseprite `.ase` o PSD con livelli nominati). Preferire Aseprite per animazioni e palette embedding.
   - Palette `.pal` o `aseprite` palette export che rispecchi le variabili CSS (`--ldc-primary`, `--ldc-contrast-yellow`, `--ldc-accent-blue`, `--ldc-rpg-green`, `--ldc-accent-orange`, `--ldc-background`, `--ldc-on-surface`).
   - README breve (metadati) in `public/assets/pixel-art/_README.md` con licenza, autore, data e versione.

Linee guida tecniche

- Palette: limitare la palette ad un massimo di 12 colori principali per asset; mappare i colori sui token CSS del progetto. Evitare gradienti e anti‑aliasing.
- Grid: lavorare su base 32px grid; le immagini 1x devono avere dimensione virtuale netta esatta (es. 320×320). Per elementi centrali usare snap alla griglia 8px.
- Scaling: esportare 1x e 2x; usare `image-rendering: pixelated` quando importati in app per evitare smoothing.
- Trasparenza: esportare PNG con canale alpha dove necessario (frame, icone). Evitare sfondo semitrasparente nelle immagini base: preferire layer separati.
- Animazione: fornire sequence frame numerati (`name-000.png`..). Fornite anche eventuali sprite sheets se preferite.
- Nomi file: minuscolo, trattino (kebab-case), prefisso `challenge-` per intro, `badge-` per badge, `frame-` per cornici.

Specifica per IntroScreen

- Dimensioni: 320×320 (1x) e 640×640 (2x)
- Contenuto: focal point centrale (personaggio, simbolo della challenge) con cornice pixel e un piccolo spazio libero sotto per il blurb text area.
- Tonalità: contrasti netti, preferire background scuro per le intro con testo chiaro che rispetti WCAG 4.5:1.
- Varianti: versione con overlay minimale (per es. vignette centrale) e versione "clean" senza overlay.

Specifica per Photo Frame (Social Arena)

- Obiettivo: cornice pixel‑art che sovrappone la preview foto pixelata; prevedere area centrale trasparente dove la preview (generata da PhotoRetroTransformer) viene incollata.
- Guideline: lasciare margine 8px per eventuale badge/hashtag placement.

Palette di riferimento (suggerita)

- primary: #bd1f76
- primary-light: #f28da3
- primary-dark: #7a144d
- contrast-yellow: #f2c641
- accent-blue: #41a6f2
- rpg-green: #2f8c2f
- accent-orange: #f25d27
- neutral-bg: #e0e0e0
- on-surface: #000000

Note per integrazione tecnica

- Posizione di rilascio: mettere tutti i PNG/AVIF in `public/assets/pixel-art/intro/` e i sorgenti in `public/assets/pixel-art/sources/`.
- Aseprite: includere export `.ase` e `.png` + `.aseprite.json` se ci sono animazioni timeline.
- Fornire una versione "preview" ottimizzata per web (AVIF o WebP) e una PNG lossless per integrazione in app offline.

Acceptance criteria (per HD to QA)

- Tutti i file richiesti presenti nelle cartelle corrette con nomi corretti.
- PNG 1x/2x rispettano dimensioni indicate e hanno trasparenze corrette.
- Palette rispettata (massimo 12 colori principali) e contrasto verificabile (almeno 4.5:1 per testi su sfondo).
- Sorgenti editabili forniti (Aseprite o PSD) con livelli nominati.
- README metadata presente.

Checklist di consegna (da spuntare prima di PR)

- [ ] `public/assets/pixel-art/intro/challenge-networking-forest-intro.png` (1x e 2x)
- [ ] `public/assets/pixel-art/intro/challenge-retro-puzzle-intro.png` (1x e 2x)
- [ ] `public/assets/pixel-art/intro/challenge-debug-dungeon-intro.png` (1x e 2x)
- [ ] `public/assets/pixel-art/intro/challenge-social-arena-intro.png` (1x e 2x)
- [ ] `public/assets/pixel-art/badges/` (gem e sigillo, 64/128 sizes)
- [ ] `public/assets/pixel-art/frames/frame-photo-1x.png` + `frame-photo-2x.png`
- [ ] `public/assets/pixel-art/icons/` (start, success, error etc.)
- [ ] `public/assets/pixel-art/particles/` (frame sequences)
- [ ] `public/assets/pixel-art/sources/` (Aseprite/PSD + palette files)
- [ ] `public/assets/pixel-art/_README.md` (metadata e istruzioni)

Note finali e raccomandazioni

- Per accelerare integrazione, includere un breve file JSON che mappa gli asset agli ID delle challenge, es:

```json
{
  "intro": {
    "networking-forest": "intro/challenge-networking-forest-intro.png",
    "retro-puzzle": "intro/challenge-retro-puzzle-intro.png",
    "debug-dungeon": "intro/challenge-debug-dungeon-intro.png",
    "social-arena": "intro/challenge-social-arena-intro.png"
  }
}
```
