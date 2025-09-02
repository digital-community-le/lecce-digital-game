import React, { useEffect, useRef, useState } from "react";
import useOCR from "@/hooks/use-ocr";
import UiDialog from '@/components/UiDialog';

type OCRResult = {
  detectedTags: string[];
  detected: boolean;
  confidence: number;
  text?: string;
};

type Props = {
  file: File;
  requiredTag: string;
  confidenceThreshold: number;
  onVerified: (result: OCRResult, forced: boolean) => Promise<void>; // called when verification finishes (either auto-success or manual)
  onAttempt?: () => void; // called when an OCR attempt fails
  failedAttempts?: number;
};

const OcrModal: React.FC<Props> = ({
  file,
  requiredTag,
  confidenceThreshold,
  onVerified,
  onAttempt,
  failedAttempts = 0,
}) => {
  const { run, ocrProgress, ocrResult, setOcrResult } = useOCR();
  const [state, setState] = useState<"running" | "failed" | "success" | "idle">(
    "running"
  );
  const [message, setMessage] = useState<string | null>(null);
  const titleId = useRef(`ocr-modal-title-${Date.now()}`);
  const descId = useRef(`ocr-modal-desc-${Date.now()}`);
  const retryButtonRef = useRef<HTMLButtonElement | null>(null);
  const manualButtonRef = useRef<HTMLButtonElement | null>(null);

  // Reusable OCR runner so Retry can re-run analysis without closing modal
  const runAnalysis = async () => {
    setState("running");
    setMessage(null);
    setOcrResult(null);
    try {
      const res = await run(file);
      const verified = !!(
        res.detected && res.confidence >= confidenceThreshold
      );
      if (verified) {
        setState("success");
        setMessage("Tag verificato con successo!");
        setTimeout(async () => {
          await onVerified(res, false);
        }, 800);
      } else {
        setState("failed");
        setMessage("Tag non rilevato o confidenza insufficiente.");
        try {
          onAttempt?.();
        } catch (e) {}
      }
    } catch (err) {
      setState("failed");
      setMessage("Errore durante l'analisi OCR");
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
    if (state === "failed") {
      // small timeout to ensure rendering
      setTimeout(() => {
        try {
          retryButtonRef.current?.focus();
        } catch (e) {}
      }, 50);
    }
  }, [state]);

  return (
    <UiDialog
      open={true}
      title="Verifica OCR"
      className="nes-dialog is-rounded p-4 max-w-md w-full"
      ariaLabelledBy={titleId.current}
      ariaDescribedBy={descId.current}
    >
      <p id={titleId.current} className="title">
        Verifica OCR
      </p>
      <div id={descId.current} className="mb-3">
        <p className="text-xs">
          Sto cercando il tag <strong>{requiredTag}</strong> nella Story
          caricata.
        </p>
      </div>

      <div className="mb-3">
        <div className="w-full bg-gray-700 rounded h-3 overflow-hidden">
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

      {state === "running" && (
        <div className="mb-3 text-xs">Analisi in corso... attendi.</div>
      )}

      {ocrResult && (
        <div className="nes-container mb-3">
          <p className="text-xs">
            Tag trovati: {ocrResult.detectedTags.join(", ") || "Nessuno"}
          </p>
          <p className="text-xs">
            Detected: {ocrResult.detected ? "Sì" : "No"} — Confidence:{" "}
            {ocrResult.confidence ?? "—"}
          </p>
        </div>
      )}

      {message && (
        <div
          className={`nes-container ${
            state === "success" ? "is-success" : "is-error"
          } mb-3 p-2`}
          role="status"
          aria-live="polite"
        >
          <p className="text-xs">{message}</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {state === "failed" && (
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
            {failedAttempts >= 2 && (
              <button
                ref={manualButtonRef}
                className="nes-btn is-success"
                onClick={async () => {
                  // manual verification: notify parent with forced=true and close modal
                  if (ocrResult) {
                    setMessage("Verifica manuale completata.");
                  } else {
                    setMessage("Verifica manuale eseguita.");
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
      </div>
    </UiDialog>
  );
};

export default OcrModal;
