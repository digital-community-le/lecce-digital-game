import React, { useEffect, useRef, useState } from "react";
import useOCR from "@/hooks/use-ocr";

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
  onRetry: () => void; // user wants to retry (re-upload)
  onAttempt?: () => void; // called when an OCR attempt fails
  failedAttempts?: number;
  onClose?: () => void; // called when the dialog actually closes
};

const OcrModal: React.FC<Props> = ({
  file,
  requiredTag,
  confidenceThreshold,
  onVerified,
  onRetry,
  onAttempt,
  onClose,
  failedAttempts = 0,
}) => {
  const { run, ocrProgress, ocrResult, setOcrResult } = useOCR();
  const [state, setState] = useState<"running" | "failed" | "success" | "idle">(
    "running"
  );
  const [message, setMessage] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useRef(`ocr-modal-title-${Date.now()}`);
  const descId = useRef(`ocr-modal-desc-${Date.now()}`);
  const retryButtonRef = useRef<HTMLButtonElement | null>(null);
  const manualButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  // Reusable OCR runner so Retry can re-run analysis without closing modal
  const runAnalysis = async () => {
    setState("running");
    setMessage(null);
    setOcrResult(null);
    try {
      dialogRef.current?.showModal();
    } catch (e) {
      // ignore if dialog already open or not supported
    }
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
          // close dialog after 3 seconds to allow user to read the success message
          try {
            if (closeTimerRef.current)
              window.clearTimeout(closeTimerRef.current);
          } catch (e) {}
          closeTimerRef.current = window.setTimeout(() => {
            try {
              dialogRef.current?.close();
            } catch (e) {}
            try {
              onClose?.();
            } catch (e) {}
          }, 3000);
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
      try {
        // clear any pending close timer
        if (closeTimerRef.current) {
          window.clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
        dialogRef.current?.close();
      } catch (e) {}
    };
  }, [file]);

  // Ensure dialog is closed when component is unmounted (extra safety)
  useEffect(() => {
    return () => {
      try {
        if (closeTimerRef.current) {
          window.clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
        dialogRef.current?.close();
      } catch (e) {}
    };
  }, []);

  // Focus management: trap focus inside modal and restore on unmount
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    if (dialog) {
      // focus the dialog container to start
      dialog.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!dialog) return;
      if (e.key === "Tab") {
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
      // Allow Escape to cancel when verification failed (acts like retry/close)
      if (e.key === "Escape") {
        if (state === "failed") {
          e.preventDefault();
          onRetry();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // restore previous focus
      try {
        previouslyFocused.current?.focus();
      } catch (e) {}
    };
  }, [state, onRetry]);

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
    <dialog
      className="nes-dialog is-rounded p-4 max-w-md w-full"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId.current}
      aria-describedby={descId.current}
      ref={dialogRef}
      tabIndex={-1}
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
                  try {
                    dialogRef.current?.close();
                    onClose?.();
                  } catch (e) {}
                }}
              >
                Verifica manuale
              </button>
            )}
          </>
        )}
      </div>
    </dialog>
  );
};

export default OcrModal;
