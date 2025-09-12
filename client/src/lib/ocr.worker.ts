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
      const requiredTags: string[] = Array.isArray(msg.requiredTags)
        ? msg.requiredTags.map((t: any) => String(t).trim()).filter(Boolean)
        : [];
      const logger = (m: any) => {
        if (m && m.status && (m.progress || m.progress === 0)) {
          (self as any).postMessage({ type: 'progress', id, status: m.status, progress: m.progress });
        }
      };

      // Preprocess image for better OCR results
      const preprocessImage = async (file: File): Promise<File> => {
        return new Promise((resolve) => {
          const canvas = new OffscreenCanvas(1, 1);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file); // Fallback to original file
            return;
          }

          const img = new Image();
          img.onload = () => {
            // Calculate optimal size (max 1024px on longest side)
            const maxSize = 1024;
            let { width, height } = img;
            if (width > maxSize || height > maxSize) {
              const ratio = Math.min(maxSize / width, maxSize / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;

            // Apply preprocessing filters
            ctx.drawImage(img, 0, 0, width, height);

            // Enhance contrast and brightness for better OCR
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
              // Enhance contrast (increase difference from gray)
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const gray = (r + g + b) / 3;

              // Increase contrast
              const contrast = 1.5;
              const brightness = 10;

              data[i] = Math.min(255, Math.max(0, (r - gray) * contrast + gray + brightness));
              data[i + 1] = Math.min(255, Math.max(0, (g - gray) * contrast + gray + brightness));
              data[i + 2] = Math.min(255, Math.max(0, (b - gray) * contrast + gray + brightness));
            }

            ctx.putImageData(imageData, 0, 0);

            // Convert back to file
            canvas.convertToBlob({ type: 'image/png', quality: 0.95 }).then((blob) => {
              if (blob) {
                const processedFile = new File([blob], file.name, { type: 'image/png' });
                console.log(`🔍 OCR WORKER DEBUG - Image preprocessed: ${file.size} -> ${processedFile.size} bytes, ${img.width}x${img.height} -> ${width}x${height}`);
                resolve(processedFile);
              } else {
                resolve(file);
              }
            }).catch(() => resolve(file));
          };

          img.onerror = () => resolve(file);
          img.src = URL.createObjectURL(file);
        });
      };

      // Preprocess the image for better OCR accuracy
      const processedFile = await preprocessImage(file);

      // use tesseract.recognize for a minimal dependency surface in the worker
      const tesseract = await import('tesseract.js');
      // prefer tesseract.recognize if available, otherwise fallback to createWorker flow
      let data: any = null;
      if (typeof (tesseract as any).recognize === 'function') {
        const res = await (tesseract as any).recognize(processedFile, 'eng', { logger });
        data = res && res.data ? res.data : res;
      } else {
        const { createWorker } = tesseract as any;
        const w: any = createWorker();
        await w.load();
        await w.loadLanguage('eng');
        await w.initialize('eng');
        const res = await w.recognize(processedFile, { logger });
        data = res && res.data ? res.data : res;
        try { await w.terminate(); } catch { }
      }

      const text = (data && (data.text || '')) as string;

      // DEBUG: Log extracted text
      console.log('🔍 OCR WORKER DEBUG - Extracted text:', text);
      console.log('🔍 OCR WORKER DEBUG - Text length:', text.length);
      console.log('🔍 OCR WORKER DEBUG - Text preview (first 200 chars):', text.slice(0, 200));

      // Improved regex patterns for better tag detection
      const patterns = [
        /([#@][\w_\-]+)/g,                    // Standard hashtags/mentions
        /([#@][\w_\-]*\s*[\w_\-]*)/g,        // Tags with potential spaces
        /(#\w+)/g,                           // Simple hashtags
        /(@\w+)/g,                           // Simple mentions
        /(lecce[_\s]*digital[_\s]*community)/gi,  // Specific pattern for our community
        /(gdg[_\s]*lecce)/gi,                // Specific pattern for GDG Lecce
      ];

      const tags: string[] = [];
      patterns.forEach((rx, index) => {
        console.log(`🔍 OCR WORKER DEBUG - Testing pattern ${index + 1}: ${rx}`);
        const patternMatches: string[] = [];
        let m: RegExpExecArray | null;
        while ((m = rx.exec(text))) {
          patternMatches.push(m[1] || m[0]);
        }
        console.log(`🔍 OCR WORKER DEBUG - Pattern ${index + 1} matches:`, patternMatches);
        tags.push(...patternMatches);
      });

      const uniqueTags = Array.from(new Set(tags));

      // DEBUG: Log tag extraction process
      console.log('🔍 OCR WORKER DEBUG - All regex matches found:', tags);
      console.log('🔍 OCR WORKER DEBUG - Unique tags:', uniqueTags);
      console.log('🔍 OCR WORKER DEBUG - Required tags:', requiredTags);

      // words must be declared before we use them to build normalizedWords
      const words = (data && (data.words as any[])) || [];

      // Compute per-tag confidences for the requested tags only.
      // More lenient normalization that preserves important characters but removes noise
      const normalize = (s: string) => String(s || '').toLowerCase()
        .replace(/\s+/g, '') // Remove spaces
        .replace(/[^\w@#_]/g, ''); // Keep word chars, @, #, _

      // Alternative normalization for fuzzy matching
      const fuzzyNormalize = (s: string) => String(s || '').toLowerCase()
        .replace(/[^\w]/g, ''); // Keep only word characters for fuzzy matching

      const normalizedWords = (words || []).map((w: any) => ({
        text: String(w.text || '').trim(),
        norm: normalize(String(w.text || '')),
        fuzzyNorm: fuzzyNormalize(String(w.text || '')),
        confidence: Number(w.confidence || 0),
      }));

      // DEBUG: Log normalization process
      console.log('🔍 OCR WORKER DEBUG - Total words found:', words.length);
      console.log('🔍 OCR WORKER DEBUG - Sample normalized words (first 10):',
        normalizedWords.slice(0, 10).map((w: any) => ({
          original: w.text,
          normalized: w.norm,
          confidence: w.confidence
        }))
      );

      const tagConfidences: Record<string, number | null> = {};
      let anyDetected = false;
      for (const tag of requiredTags) {
        const nTag = normalize(tag);
        const fuzzyTag = fuzzyNormalize(tag);
        console.log(`🔍 OCR WORKER DEBUG - Processing tag: "${tag}" -> normalized: "${nTag}" -> fuzzy: "${fuzzyTag}"`);

        // Multiple matching strategies
        const exactMatches = normalizedWords.filter((w: any) => w.norm && w.norm === nTag);
        const containsMatches = normalizedWords.filter((w: any) => w.norm && w.norm.includes(nTag));
        const fuzzyMatches = normalizedWords.filter((w: any) => w.fuzzyNorm && w.fuzzyNorm.includes(fuzzyTag));

        // Combine all matches, prioritizing exact matches
        const allMatches = [...exactMatches, ...containsMatches, ...fuzzyMatches];
        const uniqueMatches = allMatches.filter((match, index, self) =>
          index === self.findIndex(m => m.text === match.text)
        );

        console.log(`🔍 OCR WORKER DEBUG - Tag "${tag}" matching results:`);
        console.log('  - Exact matches:', exactMatches.length);
        console.log('  - Contains matches:', containsMatches.length);
        console.log('  - Fuzzy matches:', fuzzyMatches.length);
        console.log('  - Unique matches:', uniqueMatches.map((m: any) => ({
          original: m.text,
          normalized: m.norm,
          fuzzy: m.fuzzyNorm,
          confidence: m.confidence
        })));

        if (uniqueMatches.length > 0) {
          const avg = Math.round(uniqueMatches.reduce((s: number, m: any) => s + (m.confidence || 0), 0) / uniqueMatches.length);
          tagConfidences[tag] = avg;
          anyDetected = true;
          console.log(`🔍 OCR WORKER DEBUG - Tag "${tag}" FOUND with average confidence: ${avg}`);
        } else {
          tagConfidences[tag] = null;
          console.log(`🔍 OCR WORKER DEBUG - Tag "${tag}" NOT FOUND`);
        }
      }

      // detected is true if any required tag was found
      const detected = anyDetected;

      let confidence = 0;
      if (Array.isArray(words) && words.length) {
        const avg = words.reduce((s: number, w: any) => s + (w.confidence || 0), 0) / words.length;
        confidence = Math.round(avg);
      }

      // DEBUG: Log final results
      console.log('🔍 OCR WORKER DEBUG - FINAL RESULTS:');
      console.log('  - Overall confidence:', confidence);
      console.log('  - Any tag detected:', detected);
      console.log('  - Tag confidences:', tagConfidences);
      console.log('  - All detected tags:', uniqueTags);

      (self as any).postMessage({ type: 'result', id, success: true, result: { detectedTags: uniqueTags, detected, confidence, text, tagConfidences } });
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
