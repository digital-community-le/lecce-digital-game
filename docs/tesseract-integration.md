# Tesseract.js Integration — guida rapida

Scopo: integrare Tesseract.js per eseguire OCR client-side nella challenge `Social Arena` mantenendo bundle snello e UX responsiva.

## Strategie consigliate

- Lazy-load la libreria solo quando l'utente apre la schermata `Social Arena`.
- Eseguire OCR in un Web Worker per non bloccare il thread UI.
- Configurare una `confidenceThreshold` nel `game-data.json` per decidere se accettare automaticamente la detection o mostrare il fallback manual proof.

## Snippet: lazy-load + worker (bozza)

```ts
// loadTesseract.ts
export async function loadTesseract() {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker({
    logger: (m) => console.log('tesseract', m),
  });
  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  return worker;
}
```

```ts
// social-arena.service.ts (simplified)
import { loadTesseract } from './loadTesseract';

let workerPromise: Promise<any> | null = null;
export function getOCRWorker() {
  if (!workerPromise) workerPromise = loadTesseract();
  return workerPromise;
}

export async function runOCR(file: File) {
  const worker = await getOCRWorker();
  const { data } = await worker.recognize(file);
  return data;
}
```

## Considerazioni

- Bundle: `tesseract.js` è pesante, quindi la lazy-load è essenziale.
- WASM: considerare varianti con WASM per performance migliori su device moderni.
- Test manuale: verificare su immagini reali (screenshot da Instagram/LinkedIn/Twitter) e tarare `confidenceThreshold`.

## Dipendenza

Aggiungere:

```powershell
npm install tesseract.js
```

## Fallback

Se l'OCR fallisce (confidence bassa) offrire:

- Modal con opzione "Invia prova manuale" (l'utente conferma che il tag è presente)
- Possibilità di ritentare con immagine migliore
