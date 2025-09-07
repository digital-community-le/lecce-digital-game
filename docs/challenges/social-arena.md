# Social Arena — Istruzioni per sviluppo

## Titolo per mappa
La sfida comparirà con il titolo: "L'arena della Comunità"

## Missione (etichetta)
Unisci le voci e coordina la prova social

Questo documento raccoglie tutte le istruzioni tecniche e UX per la challenge "Social Arena".

## Checklist rapida

- [ ] UX end-to-end (upload screenshot → OCR locale → verifica)
- [ ] Shape dati client-side e chiavi di persistenza
- [ ] Regole di privacy (immagini locali-only) e policy anti-fraud
- [ ] `game-data.json` snippet e flags configurabili (verificationMode, allowManualProof, allowSkipWithoutSocial)
- [ ] Contract UI / persistence suggerito e acceptance criteria

## Scopo

Incentivare la condivisione social: l'utente fornisce una proof (screenshot di una storia/post) che contenga il tag della community. La proof viene verificata client-side via OCR; se il tag è rilevato la prova è considerata verificata localmente e la challenge può essere completata.

## Esperienza utente (flow end‑to‑end)

1. Entrata nella challenge

   - L'utente apre il nodo "Social Arena" dalla mappa.
   - Schermata iniziale: titolo, breve descrizione, stato (pending/completed), pulsante primario "Carica prova".

2. Caricamento della prova

   - L'utente tocca "Carica prova" e sceglie tra: "Seleziona screenshot" (rullino), "Scatta foto" (camera) o "Annulla".
   - Se permessi camera negati, mostrare fallback e istruzioni per importare immagine.

3. OCR client-side e risultato

   - L'app esegue OCR locale sull'immagine (modal con spinner e messaggio "Analizzo l'immagine..."). Raccomandazione: Tesseract.js o equivalente.
   - Se OCR trova il `requiredTag` (case-insensitive) con confidence sopra soglia configurabile, la prova è marcata `detected=true`.
   - Se OCR non rileva il tag o confidence bassa, mostrare risultati OCR grezzi e offrire opzioni: "Riprova" (nuovo upload), "Invia manuale" (se `allowManualProof: true`) o "Annulla".

4. Preview e conferma

   - Mostrare modal preview della proof con: thumbnail immagine (object URL locale), lista `detectedTags`, flag `detected`, data/ora, pulsanti: "Conferma" / "Riprova" / "Elimina".
   - Alla conferma creare `SocialProof` e salvarla localmente.

5. Persistenza locale e (opt-in) sincronizzazione

   - Salvare `SocialProof` in `ldc:social:{userId}` (array). L'immagine rimane come blob/object URL o reference locale: NON caricare l'immagine su storage remoto per default.
   - Se `remoteBackend === true` e l'operatore abilita upload esplicito (non raccomandato di default), si può enqueuere un'op op di metadata-only in `ldc:sync-queue` (non inviare immagini senza consenso esplicito).

6. Feedback e completamento

   - Se `detected === true` e le policy sono soddisfatte, aggiornare `progress` locale; mostrare messaggio "Proof verificata" e, se la challenge è completata, overlay "Challenge completata!".
   - Se l'utente sceglie di saltare la challenge (`allowSkipWithoutSocial: true`), non assegnare punti (`skipAwardsPoints: false` per default) e aggiornare lo stato locale come "skipped".

## Regole di configurazione (`game-data.json`)

Esempio di blocco challenge aggiornato:

```json
"challenges": [
  {
    "id": "social-arena",
    "type": "social",
    "settings": {
      "requiredTag": "@lecce_digital",
      "verificationMode": "ocr-client",
      "allowManualProof": true,
      "maxAttempts": 3,
      "allowSkipWithoutSocial": true,
      "skipAwardsPoints": false
    }
  }
]
```

Note:

- `verificationMode` accetta `ocr-client` (raccomandato) o `manual`.
- `allowManualProof`: abilita invio manuale in caso di OCR fallito.
- `allowSkipWithoutSocial`: permette allo user di saltare la challenge senza punti.

## Shape dati (client-side)

```ts
type SocialProof = {
  opId: string; // uuid client per idempotenza
  userId: string; // utente locale che invia
  imageLocalUrl: string; // object URL o riferimento blob (locale only)
  detectedTags: string[]; // risultati OCR
  detected: boolean; // true se tag presente con confidence sufficiente
  verified: boolean; // true se l'operatore/utente ha confermato la proof
  attempts: number;
  createdAt: string;
};
```

## Local keys / persistence

- `ldc:social:{userId}` — array di `SocialProof`
- `ldc:progress:{userId}` — stato di avanzamento generale
- `ldc:sync-queue` — coda di operazioni (metadata-only) se `remoteBackend` true

## Policy privacy e note legali (importante)

- Le immagini NON vengono caricate su storage remoto per impostazione predefinita: sono conservate solo localmente come blob/object URL.
- Non inviare immagini a servizi esterni senza autorizzazione esplicita e chiara dell'operatore/utente.
- Minimizzare retention: prevedere una politica di pulizia (es. purge dopo evento) se necessario.

## Validazione e anti-fraud

- Accettare proof solo se `detectedTags` contiene il `requiredTag` (match case-insensitive) con confidence minima configurabile.
- Limitare `maxAttempts` per utente.
- Se OCR confidence bassa ma tag presente, proporre invio manuale con warn.
- Conservare gli hash/metadati della prova (non l'immagine) per eventuale revisione futura.

## Suggested contracts (neutral)

- UI unit: `SocialArenaView`

  - State: `proofs` (array of SocialProof), `currentProof?`, `loadingOCR`
  - Methods: `openUploader()`, `runOCR(image)`, `confirmProof(proof)`, `retryProof()`, `skipChallenge()`

- Persistence API: `socialProofStore`
  - API: `createProof(imageBlob, userId) -> SocialProof`, `saveProof(proof)`, `getProofs(userId)`, `enqueueSync(op)`
  - Usa `ldc:social:{userId}` per persistenza e opzionale `ldc:sync-queue` per metadata enqueue; l'implementazione può usare IndexedDB (Dexie opzionale) per i blob.

## UX microcopy e accessibilità

- Buttons/fab: aria-label chiaro (es. `aria-label="Carica prova social"`).
- Feedback: "Analizzo immagine…", "Tag rilevato", "Nessun tag rilevato - prova con immagine più chiara".
- Focus management: trap focus nel modal di preview; ripristinare focus all'upload CTA dopo chiusura.
- Image alt text: fornire testo descrittivo generico per preview (es. "Screenshot fornito dall'utente").

## Edge cases

- Utente senza account social / non vuole pubblicare: può saltare la challenge (se `allowSkipWithoutSocial:true`) senza ricevere punti.
- OCR fallisce sistematicamente: offrire manual proof flow.
- Permessi camera negati: permettere import da rullino.
- Problemi di storage locale (quota piena): segnalare errore e offrire rimozione proofs precedenti.

## Acceptance criteria

- L'utente può caricare uno screenshot e l'app esegue OCR locale cercando `requiredTag`.
- Se il tag è rilevato con confidence sufficiente, la prova è `detected=true` e la challenge può essere marcata completata localmente.
- Le immagini NON vengono caricate su Storage per default; solo metadata e stato sono salvati localmente.
- L'utente può saltare la challenge ma non riceve punti se lo skip è selezionato.

---

File di riferimento: `INSTRUCTIONS.md` (sezione Social Arena).
