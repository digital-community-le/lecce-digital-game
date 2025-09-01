# Architettura OCR (Social Arena)

Breve: progettare l'integrazione client-side di Tesseract.js per la challenge `Social Arena` con lazy-load e Web Worker, rispettando il vincolo "immagini client-only" e ottimizzando UX su browser mobile.

## Contratto (inputs / outputs / errori)

- Input: immagine (File | Blob | DataURL) da camera o upload.
- Output: oggetto `OCRResult` { text: string, words: string[], confidence: number } e `detectedTags: string[]` estratti via regex/normalizzazione.
- Errori attesi: file non immagine, immagine troppo piccola/oscura, timeout OCR, worker OOM.

## Pattern architetturale

1. Lazy-import: non caricare `tesseract.js` nel bundle iniziale; import dinamico quando l'utente apre `Social Arena`.

2. Web Worker: istanziare Tesseract in un worker per evitare blocco del main thread.

3. Preprocess: crop e downscale controllato dell'immagine prima di passarla all'OCR per ridurre tempo e memoria.

4. Confidence-based flow: confrontare `confidence` con `confidenceThreshold` preso da `game-data.json`.

5. Fallback: quando confidence < soglia, mostrare modal per proof manuale (user-confirm) o riprova.

## Configurazione (game-data)

Esempio di campi utili in `game-data.json`:

- `challenges[].settings.requiredTag` (string)
- `challenges[].settings.verificationMode` = `ocr-client`
- `challenges[].settings.confidenceThreshold` (0..1)
- `challenges[].settings.maxAttempts`
- `global.ocr.workerTimeoutMs` (opzionale)

## Flusso dati (semplificato)

1. Utente apre Social Arena → componente richiama `getOCRWorker()` (lazy import).

2. Utente seleziona/manda immagine → l'immagine viene crop/resize client-side.

3. Invio a worker, worker esegue `recognize()` e ritorna `text` e `confidence`.

4. Parser estrae tag candidate e li normalizza (case-insensitive, strip punctuation).

5. Se `requiredTag` rilevato con confidence superiore alla soglia → salva `SocialProof` metadata-only in persistence e aggiorna progress.

6. Altrimenti → mostra fallback (manual proof, retry).

## Esempio di snippet (pseudocodice)

```ts
// gist: lazy-load + worker factory (bozza)
const worker = await importWorkerWhenNeeded();
const preprocessed = preprocessImage(file);
const { data } = await worker.recognize(preprocessed);
const text = data.text;
const confidence = estimateConfidence(data);
const detectedTags = extractTags(text);
```

## Prestazioni e ottimizzazioni (mobile-first)

- Crop: fornire UI per ritagliare area rilevante (tag/username) prima di OCR.

- Downscale: limitare risoluzione (es. max 1024px lato lungo) e usare canvas per ridurre dimensione.

- Pooling: non eseguire più di 1 OCR contemporaneo per sessione utente.

- Timeout: abortare riconoscimento oltre `workerTimeoutMs`.

## Privacy e sicurezza

- Le immagini rimangono client-only; non effettuare upload automatico.

- Salvare nel DB locale (IndexedDB) solo metadati (OCR text, detectedTags, confidence, timestamp) e un riferimento al blob se necessario.

- Offrire possibilità di rimozione dei dati dal client.

## Acceptance criteria (minimi)

- OCR eseguito in worker e non blocca UI su mobile.

- `requiredTag` rilevato correttamente per immagini di prova con soglia `confidenceThreshold` configurata.

- Fallback manual visibile e funzionante quando confidence è bassa.

## Note di integrazione futura

- Considerare variante WASM di Tesseract per prestazioni migliori su device moderni.

- Preparare adapter per invio metadata a Firestore in futuro (non attivo ora).

---

File correlati:

- `docs/tesseract-integration.md` (guida rapida)
- `docs/dexie-persistence.md` (schema per blobs + queue)
- `docs/tasks/07-social-arena.md` (task di implementazione)
