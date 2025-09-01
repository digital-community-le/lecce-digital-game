// OCR Worker (clean implementation)
// Listens for messages: { type: 'init' } | { type: 'recognize', id, file } | { type: 'terminate' }
// Emits: { type: 'init' } ack, { type: 'progress', id, status, progress }, { type: 'result', id, success, result }

self.addEventListener('message', async (ev: MessageEvent) => {
  const msg = ev.data || {};
  const type = msg.type;
  const id = msg.id;
  try {
    if (type === 'init') {
      (self as any).postMessage({ type: 'init', success: true });
      return;
    }

    if (type === 'recognize') {
      const file: File = msg.file;
      const logger = (m: any) => {
        if (m && m.status && (m.progress || m.progress === 0)) {
          (self as any).postMessage({ type: 'progress', id, status: m.status, progress: m.progress });
        }
      };

      // use tesseract.recognize for a minimal dependency surface in the worker
      const tesseract = await import('tesseract.js');
      // prefer tesseract.recognize if available, otherwise fallback to createWorker flow
      let data: any = null;
      if (typeof (tesseract as any).recognize === 'function') {
        const res = await (tesseract as any).recognize(file, 'eng', { logger });
        data = res && res.data ? res.data : res;
      } else {
        const { createWorker } = tesseract as any;
        const w: any = createWorker();
        await w.load();
        await w.loadLanguage('eng');
        await w.initialize('eng');
        const res = await w.recognize(file, { logger });
        data = res && res.data ? res.data : res;
        try { await w.terminate(); } catch {}
      }

      const text = (data && (data.text || '')) as string;
      const rx = /([#@][\w_\-]+)/g;
      const tags: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = rx.exec(text))) tags.push(m[1]);
      const uniqueTags = Array.from(new Set(tags));
      const detected = uniqueTags.some((t) => t.toLowerCase() === '@lecce_digital');

      let confidence = 0;
      const words = (data && (data.words as any[])) || [];
      if (Array.isArray(words) && words.length) {
        const avg = words.reduce((s: number, w: any) => s + (w.confidence || 0), 0) / words.length;
        confidence = Math.round(avg);
      }

      (self as any).postMessage({ type: 'result', id, success: true, result: { detectedTags: uniqueTags, detected, confidence, text } });
      return;
    }

    if (type === 'terminate') {
      (self as any).postMessage({ type: 'terminated', success: true });
      return;
    }
  } catch (err) {
    (self as any).postMessage({ type: 'error', id, success: false, error: String(err) });
  }
});
