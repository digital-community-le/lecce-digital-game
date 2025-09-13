import React, { useEffect, useRef, useState } from 'react';
import useOCR from '@/hooks/use-ocr';
import UiDialog from '@/components/UiDialog';

type OCRResult = {
  detectedTags: string[];
  detected: boolean;
  confidence: number;
  text?: string;
  tagConfidences?: Record<string, number | null>;
};

type Props = {
  file: File;
  requiredTags: string[];
  confidenceThreshold: number;
  onVerified: (result: OCRResult, forced: boolean) => Promise<void>; // called when verification finishes (either auto-success or manual)
  onAttempt?: () => void; // called when an OCR attempt fails
  failedAttempts?: number;
};

const OcrModal: React.FC<Props> = ({
  file,
  requiredTags,
  confidenceThreshold,
  onVerified,
  onAttempt,
  failedAttempts = 0,
}) => {
  const { run, ocrProgress, ocrResult, setOcrResult } = useOCR();
  const [state, setState] = useState<'running' | 'failed' | 'success' | 'idle'>(
    'running'
  );
  const [ocrUnavailable, setOcrUnavailable] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugClickCount, setDebugClickCount] = useState(0);
  const [showCacheBust, setShowCacheBust] = useState(false);
  const titleId = useRef(`ocr-modal-title-${Date.now()}`);
  const descId = useRef(`ocr-modal-desc-${Date.now()}`);
  const retryButtonRef = useRef<HTMLButtonElement | null>(null);
  const manualButtonRef = useRef<HTMLButtonElement | null>(null);

  // Reusable OCR runner so Retry can re-run analysis without closing modal
  const runAnalysis = async () => {
    console.log('🔍 OCR MODAL DEBUG - Starting OCR analysis...');
    console.log('🔍 OCR MODAL DEBUG - File info:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });
    console.log('🔍 OCR MODAL DEBUG - Required tags:', requiredTags);
    console.log(
      '🔍 OCR MODAL DEBUG - Confidence threshold:',
      confidenceThreshold
    );

    setState('running');
    setMessage(null);
    setOcrResult(null);
    try {
      console.log('🔍 OCR MODAL DEBUG - Calling OCR run function...');
      const res = await run(file, requiredTags);
      console.log(
        '🔍 OCR MODAL DEBUG - OCR run completed, processing results...'
      );
      // Log detailed OCR data for debugging; do not show it in the UI
      try {
        // eslint-disable-next-line no-console
        console.log('🔍 OCR MODAL DEBUG - Full OCR Result:', {
          detectedTags: res.detectedTags,
          tagConfidences: res.tagConfidences,
          confidence: res.confidence,
          detected: res.detected,
          textPreview: (res.text || '').slice(0, 300),
          textLength: (res.text || '').length,
          requiredTags: requiredTags,
          confidenceThreshold: confidenceThreshold,
        });
      } catch (e) {}

      // Prefer per-tag confidences when available
      let verified = false;
      console.log('🔍 OCR MODAL DEBUG - Starting verification process...');

      if (res.tagConfidences && Object.keys(res.tagConfidences).length > 0) {
        console.log(
          '🔍 OCR MODAL DEBUG - Using per-tag confidences for verification'
        );
        console.log(
          '🔍 OCR MODAL DEBUG - Tag confidences:',
          res.tagConfidences
        );
        console.log(
          '🔍 OCR MODAL DEBUG - Confidence threshold:',
          confidenceThreshold
        );

        // success if any required tag has confidence >= threshold
        const tagVerifications = Object.entries(res.tagConfidences).map(
          ([tag, conf]) => ({
            tag,
            confidence: conf,
            passes: typeof conf === 'number' && conf >= confidenceThreshold,
          })
        );

        console.log(
          '🔍 OCR MODAL DEBUG - Tag verifications:',
          tagVerifications
        );
        verified = Object.values(res.tagConfidences).some(
          (c) => typeof c === 'number' && c >= confidenceThreshold
        );
        console.log(
          '🔍 OCR MODAL DEBUG - Per-tag verification result:',
          verified
        );
      } else {
        console.log(
          '🔍 OCR MODAL DEBUG - Using fallback verification (no per-tag confidences)'
        );
        // fallback: if worker didn't provide per-tag confidences, use detectedTags + overall confidence
        const normalizedDetected = (res.detectedTags || []).map((t: string) =>
          t.toLowerCase()
        );
        const normalizedRequired = (requiredTags || []).map((t: string) =>
          t.toLowerCase()
        );

        console.log(
          '🔍 OCR MODAL DEBUG - Normalized detected tags:',
          normalizedDetected
        );
        console.log(
          '🔍 OCR MODAL DEBUG - Normalized required tags:',
          normalizedRequired
        );

        const matched = normalizedRequired.some((r: string) =>
          normalizedDetected.includes(r)
        );
        console.log('🔍 OCR MODAL DEBUG - Tag match found:', matched);
        console.log('🔍 OCR MODAL DEBUG - Overall confidence:', res.confidence);

        verified = !!(matched && res.confidence >= confidenceThreshold);
        console.log(
          '🔍 OCR MODAL DEBUG - Fallback verification result:',
          verified
        );
      }
      if (verified) {
        setState('success');
        setMessage('Tag verificato con successo!');
        setTimeout(async () => {
          await onVerified(res, false);
        }, 800);
      } else {
        setState('failed');
        setOcrUnavailable(false);
        setMessage('Tag non rilevato o confidenza insufficiente.');
        try {
          onAttempt?.();
        } catch (e) {}
      }
    } catch (err) {
      // OCR library failed to load or execute. Do not fabricate results.
      console.error('🔍 OCR MODAL ERROR - OCR execution failed:', err);
      console.error('🔍 OCR MODAL ERROR - Error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        type: typeof err,
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name,
      });
      setState('failed');
      setOcrUnavailable(true);
      setMessage(
        "Non è stato possibile completare la verifica automaticamente. Usa 'Verifica manuale' per confermare la Story."
      );
      try {
        onAttempt?.();
      } catch (e) {}
    }
  };

  useEffect(() => {
    let mounted = true;
    // run initial analysis
    runAnalysis();
    return () => {
      mounted = false;
    };
  }, [file]);

  // Move focus to first actionable button (Retry) when verification failed
  useEffect(() => {
    if (state === 'failed') {
      // small timeout to ensure rendering
      setTimeout(() => {
        try {
          if (ocrUnavailable) {
            manualButtonRef.current?.focus();
          } else {
            retryButtonRef.current?.focus();
          }
        } catch (e) {}
      }, 50);
    }
  }, [state]);

  return (
    <UiDialog
      open={true}
      title="Verifica Tags"
      className="nes-dialog is-rounded p-4 max-w-md w-full"
      ariaLabelledBy={titleId.current}
      ariaDescribedBy={descId.current}
    >
      <div id={descId.current} className="mb-3">
        <p className="text-xs">
          Sto cercando uno dei tag <strong>{requiredTags.join(', ')}</strong>{' '}
          nella Story caricata.
        </p>
      </div>

      <div className="mb-3">
        <div
          className="w-full rounded h-3 overflow-hidden cursor-pointer"
          style={{ background: 'var(--ldc-primary-dark)' }}
          onClick={() => {
            const newCount = debugClickCount + 1;
            setDebugClickCount(newCount);
            if (newCount >= 5) {
              setShowCacheBust(true);
              setShowDebugInfo(true);
            }
          }}
        >
          <div
            className="bg-green-500 h-3 transition-all"
            style={{ width: `${ocrProgress}%` }}
          />
        </div>
        <div className="text-xs mt-1" aria-hidden>
          Progresso: {ocrProgress}%
        </div>
        <div className="sr-only" aria-live="polite">
          Progresso OCR {ocrProgress} percento
        </div>
      </div>

      {state === 'running' && (
        <div className="mb-3 text-xs">Analisi in corso... attendi.</div>
      )}

      {/* Debug Information Toggle */}
      {(state === 'failed' || state === 'success') && ocrResult && (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="text-xs underline cursor-pointer hover:opacity-75"
          >
            {showDebugInfo ? 'Nascondi' : 'Mostra'} info debug
          </button>
        </div>
      )}

      {/* Debug Information Panel */}
      {showDebugInfo && ocrResult && (
        <div className="nes-container is-dark mb-3 p-2">
          <div className="text-xs">
            <h4 className="font-bold mb-2">Debug Info OCR:</h4>

            <div className="mb-2">
              <strong>Tag rilevati:</strong>{' '}
              {ocrResult.detectedTags?.length
                ? ocrResult.detectedTags.join(', ')
                : 'Nessuno'}
            </div>

            <div className="mb-2">
              <strong>Confidenza generale:</strong> {ocrResult.confidence}%
            </div>

            {ocrResult.tagConfidences && (
              <div className="mb-2">
                <strong>Confidenza per tag:</strong>
                <ul className="ml-2 mt-1">
                  {Object.entries(ocrResult.tagConfidences).map(
                    ([tag, conf]) => (
                      <li key={tag}>
                        {tag}: {conf !== null ? `${conf}%` : 'Non trovato'}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {ocrResult.text && (
              <details className="mt-2">
                <summary className="cursor-pointer">
                  Testo estratto ({ocrResult.text.length} caratteri)
                </summary>
                <div className="mt-1 p-2 bg-black bg-opacity-30 rounded text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {ocrResult.text.slice(0, 500)}
                  {ocrResult.text.length > 500 ? '...' : ''}
                </div>
              </details>
            )}
          </div>
        </div>
      )}

      {message && (
        <div
          className={`nes-container ${
            state === 'success' ? 'is-success' : 'is-error'
          } mb-3 p-2`}
          role="status"
          aria-live="polite"
        >
          <p className="text-xs">{message}</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {state === 'failed' && (
          <>
            <button
              ref={retryButtonRef}
              className="nes-btn is-warning"
              onClick={() => {
                // Re-run OCR without closing the modal
                runAnalysis();
              }}
            >
              Riprova
            </button>
            {(ocrUnavailable || failedAttempts >= 2) && (
              <button
                ref={manualButtonRef}
                className="nes-btn is-success"
                onClick={async () => {
                  // manual verification: notify parent with forced=true and close modal
                  if (ocrResult) {
                    setMessage('Verifica manuale completata.');
                  } else {
                    setMessage('Verifica manuale eseguita.');
                  }

                  await onVerified(
                    ocrResult || {
                      detectedTags: [],
                      detected: false,
                      confidence: 0,
                    },
                    true
                  );
                }}
              >
                Verifica manuale
              </button>
            )}
          </>
        )}

        {showCacheBust && (
          <button
            className="nes-btn is-error text-xs"
            onClick={() => {
              console.log('🔄 CACHE BUST - Forcing hard refresh...');
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker
                  .getRegistrations()
                  .then((registrations) => {
                    registrations.forEach((registration) => {
                      console.log('🔄 Unregistering service worker...');
                      registration.unregister();
                    });
                    // Force hard refresh
                    setTimeout(() => {
                      window.location.reload();
                    }, 100);
                  });
              } else {
                // Fallback for browsers without service worker
                window.location.reload();
              }
            }}
            title="Forza aggiornamento cache (5 click per abilitare)"
          >
            🔄
          </button>
        )}
      </div>
    </UiDialog>
  );
};

export default OcrModal;
