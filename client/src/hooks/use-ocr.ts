import { useCallback, useEffect, useRef, useState } from 'react';
import { runOCR, terminateOCRWorker } from '@/lib/ocr';

type OCRResult = { detectedTags: string[]; detected: boolean; confidence: number; text?: string };

export function useOCR() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // best-effort terminate worker when hook consumer unmounts
      try {
        terminateOCRWorker().catch(() => {});
      } catch (e) {}
    };
  }, []);

  const run = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setOcrProgress(0);
    setOcrResult(null);
    try {
      let lastProgress = 0;
      const result = await runOCR(file, (_status, progress) => {
        lastProgress = Math.max(lastProgress, Math.round(progress * 100));
        if (mounted.current) setOcrProgress(lastProgress);
      });
      if (mounted.current) setOcrResult(result);
      return result;
    } finally {
      if (mounted.current) setIsAnalyzing(false);
    }
  }, []);

  return { run, isAnalyzing, ocrProgress, ocrResult, setOcrResult } as const;
}

export default useOCR;
