# Storia: "Il Sigillo di Lecce"

## Piano breve

- Crea una storia introduttiva che unisca le 4 challenge.
- L'ordine delle challenge in gioco è variabile, ma la challenge che genera la storia condivisibile deve essere sempre l'ultima (Social Arena / foto allo stand con gadget).
- Fornisci blurb per ogni challenge, microcopy suggerita, e regole UX per la challenge finale.

---

## Premessa narrativa

Benvenuto, Viaggiatore: al centro della città giace un antico Sigillo, forgiato dalle storie e dal fervore della comunità. Un tempo pulsante di energia, ora il Sigillo giace in silenzio, frammentato in quattro gemme. Solo un'azione corale potrà risvegliare la sua luce.

Tu sei scelto per questa impresa. Attraversa i sentieri nascosti, decifra gli enigmi dimenticati e dimostra il valore del tuo legame con la comunità. Ogni prova custodisce una gemma: una per ciascuna delle quattro sfide. Le quattro gemme — Gemma dell'Alleanza (Networking Forest), Gemma della Memoria (Retro Puzzle), Gemma della Sapienza (Debug Dungeon) e Gemma della Comunità (Social Arena) — devono essere riunite perché il Sigillo possa riaccendersi. Quando l'ultima scintilla sarà riunita, il Sigillo si accenderà e Lecce canterà il suo splendore.

Le prove seguono questa sequenza precisa, comune a tutti gli eroi: **Networking Forest → Retro Puzzle → Debug Dungeon → Social Arena (epilogo allo stand)**. Solo alla fine, davanti allo stand e al gadget che simboleggia l'unione della community, potrai suggellare la tua impresa.

---

## Cast e tone

- Protagonista: il giocatore (tu). Testo in seconda persona, tono amichevole e leggermente epico.
- NPC/Elementi: la mappa (guida), i nodi (mentori/guardiani), lo stand (altare finale).
- Lunghezza: testi brevi, mobile-first, microcopy chiara.

---

## Blurb introduttivo (schermata iniziale della storia)

Titolo: "Il Sigillo di Lecce — Risveglio"
Testo: "Un'antica forza dorme sotto le pietre della città. Solo chi saprà unire mente, coraggio e comunità potrà riaccendere il Sigillo. Accetta la chiamata e scrivi la tua leggenda."
CTA: "Inizia la tua leggenda"

---

## Descrizione challenge (intro rapida per la card sulla mappa)

- Networking Forest

  - Blurb: "Nel Bosco del Networking sei alla ricerca di compagni d'avventura: scansiona i QR dei partecipanti per incontrare alleati, raccogliere storie e formare la tua ciurma."
  - Microcopy hint: "Inquadra il QR di un partecipante per reclutarlo nella tua ciurma; evita l'autoscansionamento."
  - Ricompensa: Gemma dell'Alleanza — suggella i legami con la comunità e illumina i sentieri condivisi.

- Retro Puzzle

  - Blurb: "Nella Torre dei Ricordi i simboli si sono disallineati: ripristina l'ordine delle rune e riporta la memoria perduta."
  - Microcopy hint: "Tocca, abbina, trionfa: ogni combinazione corretta avvicina il Sigillo al risveglio."
  - Ricompensa: Gemma della Memoria — conserva i ricordi e permette di ricomporre frammenti dimenticati.

- Debug Dungeon

  - Blurb: "Nel Dungeon del Sapere i saggi pongono prove di ingegno: risolvi i loro quesiti e conquista la gemma della conoscenza."
  - Microcopy hint: "Ogni domanda è una chiave: rispondi con attenzione e coraggio."
  - Ricompensa: Gemma della Sapienza — dona chiarezza e apre la via alla comprensione profonda.

- Social Arena (finale obbligatorio per la storia)
  - Blurb: "Davanti allo Stand, il tuo gesto diventa simbolo: cattura la foto con il gadget e attiva l'epilogo della leggenda."
  - Microcopy hint: "Scatta la foto al gadget nello stand; lascia che la comunità veda la tua impresa."
  - Ricompensa: Gemma della Comunità — l'emblema dell'unione e della celebrazione collettiva, necessaria per completare il Sigillo.

---

## Regole sull'ordine delle challenge

- L'ordine di completamento è fisso e uguale per tutti i partecipanti: **1) Networking Forest, 2) Retro Puzzle, 3) Debug Dungeon, 4) Social Arena (ultima).**
- Il motore di gioco registra lo stato di ogni challenge e controlla la progressione sequenziale: una challenge si sblocca quando la precedente è completata.

---

## Esecuzione della scena finale (Social Arena)

- Flow UX consigliato:

  1. Entrata: pagina Social Arena spiega che la foto allo stand è la prova finale per completare la storia.
  2. Istruzioni chiare su dove trovare il gadget visivo e come inquadrarlo.
  3. Upload/Camera: camera integrata con suggerimenti overlay (outline del gadget, autofocus) + fallback import immagine.
  4. OCR client-side (Tesseract.js in worker): rilevamento del tag ufficiale (es. "#LecceDigital2025" o testo specificato in `game-data.json`).
  5. Preview: mostra il risultato OCR e la foto raccolta; pulsanti "Conferma e salva prova" / "Riprova" / "Invia manuale".
  6. Se la prova è verificata e tutte le altre gemme (le 4 gemme raccolte dalle rispettive challenge) sono già ottenute, mostra l'epilogo della storia in una schermata dedicata con animazione celebrativa e pulsante "Condividi la mia storia".

- Acceptance criteria per la prova finale:
  - Foto acquisita e salvata localmente (IndexedDB, Dexie opzionale, se necessario).
  - OCR ha rilevato il tag richiesto con confidence >= config.threshold oppure l'utente ha inviato prova manuale confermata.
  - Le quattro gemme risultano raccolte (ogni challenge ha restituito la rispettiva gemma) e sono presenti in `ldc:progress:{userId}`.
  - L'epilogo si sblocca e l'utente può scaricare o condividere l'immagine (condivisione client-side, nessun upload remoto di immagini per default).

---

## Epilogo (testo della schermata vittoria)

Titolo: "Il Sigillo è Riattivato"
Testo: "Le gemme si sono riunite. La luce del Sigillo si è alzata sopra la città, un faro che celebra il coraggio e il legame della community. Il tuo nome ora brilla tra i custodi della leggenda."
CTA primario: "Scarica la mia storia"
CTA secondario: "Condividi la mia leggenda"

Micro-interazione: esplosione di particelle pixelate e coro 8-bit che accompagna la rivelazione del Sigillo.

---

## Microcopy per condivisione (suggerita)

- Titolo breve: "Ho riacceso il Sigillo di Lecce!"
- Testo: "Ho percorso sentieri e sfide al DevFest Lecce e riunito le gemme del Sigillo con la community. Unisciti alla leggenda!"
- Hashtag consigliati: `#LecceDigital #DevFestLecce #SigilloDiLecce`

---

## Asset e suggerimenti tecnici

- Fornire un gadget visivo fisico con pattern testuale chiaro (es. sticker con `#LecceDigital2025` e piccolo logo) per facilitare OCR.
- Predisporre un pannello allo stand con buona illuminazione e contrasto per foto affidabili.
- Template grafico per epilogo (PNG + animazioni CSS/JS) e un badge digitale da rilasciare lato client.

---

## Metricas di successo

- Tasso di completamento storia (target >50% dei giocatori che fanno almeno 3 challenge).
- Percentuale di OCR automatico vittorioso (target >80% con buone condizioni di luce).
- Numero di condivisioni social generate.

---

## Note operative e legalità

- Privacy: le immagini rimangono client-side per default. Se il remote backend viene abilitato, chiedere esplicito consenso per upload.
- GDPR: fornire informativa rapida nella schermata Social Arena e link alla privacy policy.
