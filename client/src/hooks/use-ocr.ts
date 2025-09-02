import { useCallback, useEffect, useRef, useState } from 'react';
import { runOCR } from '@/lib/ocr';

type OCRResult = { detectedTags: string[]; detected: boolean; confidence: number; text?: string; tagConfidences?: Record<string, number | null> };

export function useOCR() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (file: File, requiredTags: string[] = []) => {
    setIsAnalyzing(true);
    setOcrProgress(0);
    setOcrResult(null);
    try {      
      const result = await runOCR(file, requiredTags, (status, progress) => {
        if (mounted.current) setOcrProgress(Math.round(progress * 100));
      });
      if (mounted.current) {
        setOcrProgress(100);
        setOcrResult(result);
      }
      return result;
    } finally {
      if (mounted.current) setIsAnalyzing(false);
    }
  }, []);

  return { run, isAnalyzing, ocrProgress, ocrResult, setOcrResult } as const;
}

export default useOCR;
