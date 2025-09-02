import { useCallback, useEffect, useRef, useState } from 'react';
import { runOCR } from '@/lib/ocrWorker';

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
    };
  }, []);

  const run = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setOcrProgress(0);
    setOcrResult(null);
    try {
      // Simulate progress for UI feedback
      const progressUpdates = [25, 50, 75, 90];
      progressUpdates.forEach((progress, index) => {
        setTimeout(() => {
          if (mounted.current) setOcrProgress(progress);
        }, (index + 1) * 200);
      });
      
      const result = await runOCR(file);
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
