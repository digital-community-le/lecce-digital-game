import React, { useState, useEffect, useRef, useMemo } from "react";
import { useGameStore } from "@/hooks/use-game-store";
import { gameStorage } from "@/lib/storage";
import { putBlob, getBlobUrl } from "@/lib/blobStore";
import useOCR from "@/hooks/use-ocr";
import { SocialProof } from "@shared/schema";
import CameraCapture from "@/components/CameraCapture";
import OcrModal from "@/components/OcrModal";
import ChallengeCompleted from '@/components/ChallengeCompleted';

const SocialArena: React.FC = () => {
  const { gameState, updateChallengeProgress, showToast } = useGameStore();

  // Proofs & files
  const [proof, setProof] = useState<SocialProof | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<string | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [sharePhase, setSharePhase] = useState<
    "idle" | "captured" | "shared" | "await_screenshot"
  >("idle");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [forcedValidated, setForcedValidated] = useState(false);
  const [showShareGuide, setShowShareGuide] = useState(false);

  // challenge settings (fallbacks to sensible defaults)
  const challenge = gameState.challenges.find((c) => c.id === "social-arena");
  const requiredTag = (challenge as any)?.settings?.requiredTag ?? "@lecce_digital_community";
  const confidenceThreshold = (challenge as any)?.settings?.confidenceThreshold ?? 70;

  useEffect(() => {
    // Load latest proof from storage and update UI/progress
    if (!gameState.currentUser.userId) {
      setIsLoading(false);
      return;
    }

    const userProofs = gameStorage.getSocialProofs(gameState.currentUser.userId);
    const latest = userProofs && userProofs.length > 0 ? userProofs[userProofs.length - 1] : null;
    setProof(latest || null);
    if (latest && typeof latest.imageLocalUrl === 'string' && latest.imageLocalUrl.startsWith('blob_')) {
      getBlobUrl(latest.imageLocalUrl)
        .then((u) => { if (u) setProofPreviewUrl(u); })
        .catch(() => {});
    }
    setIsLoading(false);

    const validProof = userProofs.find((p) => p.detected && p.verified);
    if (validProof) updateChallengeProgress('social-arena', 1, true);
  }, [gameState.currentUser.userId]);

  const handleTakePicture = () => {
    // Prefer using native camera capture component
    setShowCamera(true);
    return;

    // Fallback: create a file input for camera capture dynamically
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.setAttribute("capture", "environment");
      input.style.display = "none";

      const onChange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          setSelectedFile(file);
        }
        // cleanup
        input.removeEventListener("change", onChange);
        if (input.parentNode) input.parentNode.removeChild(input);
      };

      input.addEventListener("change", onChange);
      document.body.appendChild(input);
      input.click();
    } catch (err) {
      console.error("Errore nell’aprire la fotocamera/file picker:", err);
      showToast(
        'Impossibile aprire la fotocamera. Usa "Scegli immagine".',
        "error"
      );
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      showToast("Seleziona un'immagine valida", 'error');
      return;
    }

    if (selectedPreviewUrl) {
      try { URL.revokeObjectURL(selectedPreviewUrl); } catch (e) {}
      setSelectedPreviewUrl(null);
    }

    setSelectedFile(file);
    setSelectedPreviewUrl(URL.createObjectURL(file));
    setFailedAttempts(0);
    setSharePhase('captured');

    if (!gameState.currentUser.userId) return;
    try {
      const blobId = await putBlob(file);
      const proof: SocialProof = {
        opId: `proof_${Date.now()}`,
        userId: gameState.currentUser.userId,
        imageLocalUrl: blobId,
        detectedTags: [],
        detected: false,
        verified: false,
        attempts: 0,
        createdAt: new Date().toISOString(),
      };
      gameStorage.addSocialProof(gameState.currentUser.userId, proof);
      setProof(proof);
      try { const url = await getBlobUrl(blobId); setProofPreviewUrl(url || null); } catch {}
      setSharePhase('captured');
      showToast("Immagine salvata. Ora condividi la storia o salta se non vuoi condividerla.", 'info');
    } catch (err) {
      console.error('Errore salvataggio immagine:', err);
      showToast('Errore nel salvataggio dell\'immagine', 'error');
    }
  };

  const handleCameraCapture = async (file: File) => {
    // Persist the captured image as a pending proof but DO NOT run OCR.
    setShowCamera(false);
    if (selectedPreviewUrl) {
      try {
        URL.revokeObjectURL(selectedPreviewUrl);
      } catch (e) {}
      setSelectedPreviewUrl(null);
    }
    setSelectedFile(file);
    setSelectedPreviewUrl(URL.createObjectURL(file));
    // reset failed attempts when user provides a new image
    setFailedAttempts(0);
    // advance UI to share step immediately
    setSharePhase("captured");
    if (!gameState.currentUser.userId) return;
    try {
      const blobId = await putBlob(file);
      const proof: SocialProof = {
        opId: `proof_${Date.now()}`,
        userId: gameState.currentUser.userId,
        imageLocalUrl: blobId,
        detectedTags: [],
        detected: false,
        verified: false,
        attempts: 0,
        createdAt: new Date().toISOString(),
      };
      gameStorage.addSocialProof(gameState.currentUser.userId, proof);
      setProof(proof);
      try {
        const url = await getBlobUrl(blobId);
        setProofPreviewUrl(url || null);
      } catch {}
      setSharePhase("captured");
      showToast(
        "Immagine salvata. Ora condividi la storia o salta se non vuoi condividerla.",
        "info"
      );
    } catch (err) {
      console.error("Errore salvataggio immagine:", err);
      showToast("Errore nel salvataggio dell'immagine", "error");
    }
  };

  const handleCameraCancel = () => {
    setShowCamera(false);
  };

  // runOCR provided by worker wrapper from '@/lib/ocr'

  const handleUpload = async () => {
    // For the share flow we persist the captured image but do NOT run OCR on it.
    // Only the uploaded Story screenshot is used for verification.
    if (!selectedFile || !gameState.currentUser.userId) return;

    setIsUploading(true);
    try {
      const blobId = await putBlob(selectedFile);
      // Save a pending proof record (not verified and no OCR run yet)
      const proof: SocialProof = {
        opId: `proof_${Date.now()}`,
        userId: gameState.currentUser.userId,
        imageLocalUrl: blobId,
        detectedTags: [],
        detected: false,
        verified: false,
        attempts: 0,
        createdAt: new Date().toISOString(),
      };

      gameStorage.addSocialProof(gameState.currentUser.userId, proof);
      setProof(proof);
      try {
        const url = await getBlobUrl(blobId);
        setProofPreviewUrl(url || null);
      } catch {}

      setSharePhase("await_screenshot");
      showToast(
        "Immagine salvata. Condividi la storia e poi carica lo screenshot per la verifica.",
        "info"
      );
    } catch (error) {
      console.error("Error saving image blob:", error);
      showToast("Errore nel salvataggio dell'immagine", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Handler when user uploads the screenshot of the shared story
  const handleScreenshotSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !gameState.currentUser.userId) return;
    // Save screenshot to state and open OCR modal; modal will run OCR and call onVerified/onAttempt
    if (screenshotPreviewUrl) {
      try {
        URL.revokeObjectURL(screenshotPreviewUrl);
      } catch (e) {}
      setScreenshotPreviewUrl(null);
    }
    setScreenshotFile(file);
    setScreenshotPreviewUrl(URL.createObjectURL(file));
    setOcrModalOpen(true);
  };

  const handleForceValidate = () => {
    if (!gameState.currentUser.userId) return;
    updateChallengeProgress("social-arena", 1, true);
    setForcedValidated(true);
    showToast("Prova convalidata manualmente.", "success");
  };

  const handleSkipChallenge = () => {
    // allow user to skip the challenge; mark as completed but unverified
    if (!gameState.currentUser.userId) return;
    // Skip: mark as completed (but do not mark OCR/verification as done). Progress only reaches 100% when OCR succeeds or manual validation.
    updateChallengeProgress("social-arena", 1, true);
    showToast(
      "Hai scelto di saltare la condivisione. La challenge è considerata completata senza verifica.",
      "info"
    );
  };

  // single proof view
  const isCompleted = useMemo(
    () => !!proof?.verified,
    [proof, proofPreviewUrl]
  );

  // Define a clear step-based progression
  const totalSteps = 3; // 1: capture/upload, 2: share (or await screenshot), 3: screenshot & OCR (or skip)
  const step1Done = sharePhase !== "idle";
  const step2Done =
    sharePhase === "shared" || sharePhase === "await_screenshot";
  // Final step only completes when OCR verified (isCompleted) or manual validation occurred (forcedValidated)
  const step3Done = isCompleted || forcedValidated;
  const currentStepNumber = step3Done ? 3 : step2Done ? 2 : step1Done ? 1 : 0;
  const progressPercent = Math.round((currentStepNumber / totalSteps) * 100);
  // Map progress percent to NES.css progress variants
  const progressClass =
    progressPercent >= 100
      ? "is-success"
      : progressPercent >= 66
      ? "is-primary"
      : progressPercent >= 33
      ? "is-warning"
      : "is-error";
  // no-op: preview URL is stored in proofPreviewUrl

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="title bg-card">Social Arena</p>
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  return (
    <div>
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onCancel={handleCameraCancel}
        />
      )}
      <div className="p-4">
        {/* Challenge description */}
        <div className="mb-6">
          <h3 className="font-retro text-sm mb-3">La Prova Finale</h3>
          <p className="text-sm mb-4">
            Davanti allo Stand, il tuo gesto diventa simbolo: cattura la foto
            con il gadget e attiva l'epilogo della leggenda.
          </p>
          <div className="nes-container is-dark p-3 mb-4">
            <p className="text-xs">
              💡 Scatta la foto al gadget nello stand; lascia che la comunità
              veda la tua impresa. Il sistema rileverà automaticamente il tag{" "}
              {requiredTag}.
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progressione</span>
            <span data-testid="text-social-progress">
              {currentStepNumber > 0 ? currentStepNumber : 0}/{totalSteps}
            </span>
          </div>
          <div>
            <progress
              className={`nes-progress ${progressClass}`}
              value={progressPercent}
              max={100}
            />
          </div>
        </div>

        {!isCompleted ? (
          <>
            {/* Upload area */}
            <div className="border-4 border-dashed border-muted-foreground p-8 text-center mb-6">
              {/* Step 1: no selectedFile yet -> show capture/upload only */}
              {!selectedFile && (
                <div className="space-y-4">
                  <div className="text-4xl">
                    {selectedPreviewUrl ? (
                      <img
                        src={selectedPreviewUrl}
                        alt="Preview"
                        className="w-16 h-16 object-cover inline-block"
                      />
                    ) : (
                      "📸"
                    )}
                  </div>
                  <p className="text-sm mb-4">
                    Carica la foto con il gadget della community
                  </p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <button
                      className="nes-btn is-primary"
                      onClick={handleTakePicture}
                      data-testid="button-take-picture"
                    >
                      Scatta foto
                    </button>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) =>
                        handleFileSelect(
                          e as React.ChangeEvent<HTMLInputElement>
                        )
                      }
                      data-testid="input-camera-hidden"
                    />
                    <label className="nes-btn is-normal cursor-pointer">
                      Scegli immagine
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        data-testid="input-select-image"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Step 2: after selectedFile saved (sharePhase === 'captured') -> show only share or skip */}
              {selectedFile && sharePhase === "captured" && (
                <div className="space-y-4">
                  <div className="text-4xl">
                    {selectedPreviewUrl ? (
                      <img
                        src={selectedPreviewUrl}
                        alt="Preview"
                        className="w-16 h-16 object-cover inline-block"
                      />
                    ) : (
                      "📸"
                    )}
                  </div>
                  <p className="text-sm">
                    Immagine selezionata: {selectedFile.name}
                  </p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <button
                      className="nes-btn is-normal"
                      onClick={async () => {
                        if (navigator.share && selectedFile) {
                          try {
                            await navigator.share({
                              files: [selectedFile],
                              text: "Condivido la mia storia su Instagram",
                            });
                            setSharePhase("shared");
                            showToast(
                              "Condividi la storia su Instagram, poi torna qui e carica lo screenshot.",
                              "info"
                            );
                          } catch (e) {
                            setSharePhase("await_screenshot");
                            showToast(
                              "Perfetto: ora carica lo screenshot della Story.",
                              "info"
                            );
                          }
                        } else {
                          setSharePhase("await_screenshot");
                          showToast(
                            "Condividi manualmente su Instagram, poi carica lo screenshot da questa schermata.",
                            "info"
                          );
                        }
                      }}
                    >
                      Condividi
                    </button>
                    <button
                      className="nes-btn is-warning"
                      onClick={() => handleSkipChallenge()}
                    >
                      Salta condivisione
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: after sharePhase advances to 'shared' or 'await_screenshot' -> allow screenshot upload and OCR */}
              {selectedFile &&
                (sharePhase === "shared" ||
                  sharePhase === "await_screenshot") && (
                  <div className="space-y-4">
                    <div className="text-4xl">
                      {screenshotPreviewUrl ? (
                        <img
                          src={screenshotPreviewUrl}
                          alt="Screenshot preview"
                          className="w-16 h-16 object-cover inline-block"
                        />
                      ) : (
                        "📸"
                      )}
                    </div>
                    <p className="text-sm">
                      Hai condiviso la foto? Carica lo screenshot della Story
                      per la verifica.
                    </p>
                    <input
                      id="input-screenshot-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleScreenshotSelect}
                      data-testid="input-screenshot-upload"
                    />
                    <label
                      htmlFor="input-screenshot-upload"
                      className="nes-btn is-normal cursor-pointer"
                    >
                      Carica screenshot della Story
                    </label>
                    <div>
                      <button
                        className="nes-btn is-normal"
                        onClick={() => setSelectedFile(null)}
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                )}
            </div>

            {/* OCR UI moved into modal (modal shows progress, result and actions) */}

            {/* OCR Modal component */}
            {ocrModalOpen && screenshotFile && (
              <OcrModal
                file={screenshotFile}
                requiredTag={requiredTag}
                confidenceThreshold={confidenceThreshold}
                failedAttempts={failedAttempts}
                onAttempt={() => {
                  setFailedAttempts((n) => n + 1);
                }}
                onVerified={async (result, forced) => {
                  // persist proof and update progress if verified or forced
                  if (!gameState.currentUser.userId) return;
                  try {
                    const blobId = await putBlob(screenshotFile);
                    const proof: SocialProof = {
                      opId: `proof_${Date.now()}`,
                      userId: gameState.currentUser.userId,
                      imageLocalUrl: blobId,
                      detectedTags: result?.detectedTags || [],
                      detected: !!result?.detected,
                      // If user manually forces verification, treat as verified
                      verified:
                        forced ||
                        (!!result?.detected &&
                          result.confidence >= confidenceThreshold),
                      attempts: 1,
                      createdAt: new Date().toISOString(),
                    };
                    gameStorage.addSocialProof(
                      gameState.currentUser.userId,
                      proof
                    );
                    setProof(proof);
                    try {
                      const url = await getBlobUrl(blobId);
                      setProofPreviewUrl(url || null);
                    } catch {}
                    if (proof.verified) {
                      updateChallengeProgress("social-arena", 1, true);
                      setForcedValidated(true);
                      setFailedAttempts(0);
                    } else {
                      setFailedAttempts((n) => n + 1);
                    }
                  } catch (err) {
                    console.error(
                      "Error saving screenshot proof after OCR modal verification",
                      err
                    );
                  } finally {
                    setOcrModalOpen(false);
                  }
                }}
              />
            )}

            {/* Post-OCR action area removed per request */}

            {/* Share guide modal */}
            {showShareGuide && (
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-70">
                <div className="bg-white rounded-lg p-4 max-w-md w-full">
                  <h3 className="font-retro text-sm mb-2">
                    Come condividere su Instagram
                  </h3>
                  <ol className="text-xs mb-3">
                    <li>Apri Instagram e crea una nuova Storia.</li>
                    <li>Carica la foto che hai appena scattato.</li>
                    <li>
                      Pubblica la Storia e fai uno screenshot della Storia
                      pubblicata.
                    </li>
                    <li>
                      Torni qui e usa "Carica screenshot" per caricare lo
                      screenshot della Storia.
                    </li>
                  </ol>
                  <div className="flex justify-end gap-2">
                    <button
                      className="nes-btn is-normal"
                      onClick={() => setShowShareGuide(false)}
                    >
                      Chiudi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Latest proof result removed per request */}
          </>
        ) : (
          /* Completion message */
          <div className="text-center">
            <div className="nes-container is-success p-4 mb-4">
              <div className="flex items-center justify-center gap-4 mb-2">
                <div className="text-5xl">🏆</div>
                {proof && (
                  <img
                    src={proofPreviewUrl || (proof.imageLocalUrl as string)}
                    alt="Prova verificata"
                    className="w-16 h-16 object-cover border-2 border-black"
                  />
                )}
              </div>
              <h4 className="font-retro text-sm mb-2">Arena Conquistata!</h4>
              <p className="text-sm mb-3">
                La tua prova è stata verificata! La leggenda del Sigillo è ora
                completa.
              </p>
              {proof && (
                <div className="nes-container is-light p-3">
                  <div className="text-xs text-left">
                    <div>Tag rilevati: {proof.detectedTags.join(", ")}</div>
                    <div>
                      Verificato:{" "}
                      {new Date(proof.createdAt).toLocaleString("it-IT")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialArena;
