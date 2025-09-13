let workerPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = new Promise((resolve, reject) => {
      try {
        // Add cache busting timestamp to force worker reload
        const workerUrl = new URL('./ocr.worker.ts', import.meta.url);
        workerUrl.searchParams.set('t', Date.now().toString());
        console.log('🔍 OCR DEBUG - Loading worker with cache bust:', workerUrl.href);

        const w = new Worker(workerUrl, { type: 'module' });
        resolve(w);
      } catch (err) {
        reject(err);
      }
    });
  }
  return workerPromise;
}

export async function runOCR(
  file: File,
  requiredTags: string[] = [],
  onProgress?: (status: string, progress: number) => void
): Promise<{ detectedTags: string[]; detected: boolean; confidence: number; text?: string; tagConfidences?: Record<string, number | null> }> {
  const worker = await getWorker();
  // initialize worker (best-effort)
  (worker as any).postMessage({ type: 'init' });

  return new Promise((resolve, reject) => {
    const id = `ocr_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const onMessage = (ev: MessageEvent) => {
      const msg = ev.data || {};
      if (msg.type === 'progress' && msg.id === id) {
        if (onProgress) onProgress(msg.status, msg.progress);
        return;
      }
      if (msg.type === 'result' && msg.id === id) {
        worker.removeEventListener('message', onMessage);
        if (msg.success) resolve(msg.result);
        else reject(new Error(msg.error || 'OCR failed'));
      }
      if (msg.type === 'error' && msg.id === id) {
        worker.removeEventListener('message', onMessage);
        reject(new Error(msg.error || 'OCR error'));
      }
    };
    worker.addEventListener('message', onMessage);
    try {
      (worker as any).postMessage({ type: 'recognize', id, file, requiredTags });
    } catch (err) {
      worker.removeEventListener('message', onMessage);
      reject(err);
    }
  });
}

export async function terminateOCRWorker(): Promise<void> {
  const worker = await getWorker();
  (worker as any).postMessage({ type: 'terminate' });
}
