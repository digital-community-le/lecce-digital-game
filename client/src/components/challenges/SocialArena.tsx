import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { gameStorage } from '@/lib/storage';
import { putBlob, getBlobUrl } from '@/lib/blobStore';
import { SocialProof } from '@shared/schema';
import OcrModal from '@/components/OcrModal';
import ChallengeContentLayout from '@/components/layout/ChallengeContentLayout';
import communityGem from '@assets/images/gem-of-community.png';
import GameData from '@/assets/game-data.json';

const SocialArena: React.FC = () => {
  const { gameState, updateChallengeProgress, showToast } = useGameStore();

  // Simplified state - only what's needed for file upload + OCR
  const [proof, setProof] = useState<SocialProof | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(
    null
  );

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);

  // Challenge settings
  const challenge = gameState.challenges.find((c) => c.id === 'social-arena');
  const staticChallenge = (GameData as any)?.challenges?.find(
    (c: any) => c.id === 'social-arena'
  );
  const staticSettings = (staticChallenge && staticChallenge.settings) || {};

  // Required tags configuration
  const rawRequiredFromRuntime =
    (challenge as any)?.settings?.requiredTags ??
    (challenge as any)?.settings?.requiredTag;
  const rawRequiredFromStatic =
    staticSettings?.requiredTags ?? staticSettings?.requiredTag;
  const rawRequired = rawRequiredFromRuntime ?? rawRequiredFromStatic;

  let requiredTags: string[] = [];
  if (Array.isArray(rawRequired)) {
    requiredTags = rawRequired.filter(
      (t) => typeof t === 'string' && t.trim().length > 0
    );
  } else if (typeof rawRequired === 'string' && rawRequired.trim().length > 0) {
    requiredTags = [rawRequired.trim()];
  }

  const hasRequiredTags = requiredTags.length > 0;
  const confidenceThreshold =
    (challenge as any)?.settings?.confidenceThreshold ??
    staticSettings?.confidenceThreshold ??
    40;

  useEffect(() => {
    // Load existing proof if any
    if (!gameState.currentUser.userId) {
      setIsLoading(false);
      return;
    }

    const userProofs = gameStorage.getSocialProofs(
      gameState.currentUser.userId
    );
    const latest =
      userProofs && userProofs.length > 0
        ? userProofs[userProofs.length - 1]
        : null;

    if (latest) {
      setProof(latest);
      getBlobUrl(latest.imageLocalUrl)
        .then((url) => {
          if (url) setProofPreviewUrl(url);
        })
        .catch(() => {});
    }

    setIsLoading(false);
  }, [gameState.currentUser.userId]);

  // Simplified handler for direct file upload + OCR verification
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      showToast("Seleziona un'immagine valida", 'error');
      return;
    }

    if (selectedPreviewUrl) {
      try {
        URL.revokeObjectURL(selectedPreviewUrl);
      } catch (e) {}
      setSelectedPreviewUrl(null);
    }

    setSelectedFile(file);
    setSelectedPreviewUrl(URL.createObjectURL(file));
    setFailedAttempts(0);

    // Start OCR immediately if tags are required
    if (hasRequiredTags) {
      setOcrModalOpen(true);
    } else {
      // If no tags required, just save as verified proof
      await handleDirectVerification(file);
    }
  };

  // Handle direct verification when no tags are required or for manual verification
  const handleDirectVerification = async (file: File) => {
    if (!gameState.currentUser.userId) return;

    try {
      const blobId = await putBlob(file);
      const proof: SocialProof = {
        opId: `proof_${Date.now()}`,
        userId: gameState.currentUser.userId,
        imageLocalUrl: blobId,
        detectedTags: [],
        detected: true,
        verified: true,
        attempts: 1,
        createdAt: new Date().toISOString(),
      };

      gameStorage.addSocialProof(gameState.currentUser.userId, proof);
      setProof(proof);

      try {
        const url = await getBlobUrl(blobId);
        setProofPreviewUrl(url || null);
      } catch {}

      // Complete the challenge
      updateChallengeProgress('social-arena', 1, true);
      showToast('Challenge Social Arena completata!', 'success');
    } catch (err) {
      console.error('Errore salvataggio immagine:', err);
      showToast("Errore nel salvataggio dell'immagine", 'error');
    }
  };

  const isCompleted = (challenge?.progress ?? 0) >= 1;

  if (isLoading) {
    return (
      <ChallengeContentLayout
        gemTitle="Gemma della Comunità"
        gemIcon="💎"
        description="Condividi la tua esperienza DevFest con la community!"
        tip="Carica uno screenshot per completare la Social Arena"
        progress={challenge?.progress ?? 0}
        total={1}
        isCompleted={isCompleted}
      >
        <div className="text-center p-4">
          <p>Caricamento...</p>
        </div>
      </ChallengeContentLayout>
    );
  }

  return (
    <ChallengeContentLayout
      gemTitle="Gemma della Comunità"
      gemIcon="💎"
      description="Condividi la tua esperienza DevFest con la community!"
      tip={
        hasRequiredTags
          ? `Carica uno screenshot che contenga i tag: ${requiredTags.join(', ')}`
          : "Carica un'immagine per completare la challenge"
      }
      progress={challenge?.progress ?? 0}
      total={1}
      isCompleted={isCompleted}
    >
      <div className="space-y-4">
        <div className="nes-container with-title is-dark p-3">
          <p className="title text-white font-bold">Missione</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            {hasRequiredTags ? (
              <>
                Carica uno screenshot della tua Story Instagram che contiene i
                tag <strong>{requiredTags.join(', ')}</strong> per completare
                questa sfida!
              </>
            ) : (
              "Carica un'immagine per completare questa sfida!"
            )}
          </p>
        </div>

        {!isCompleted ? (
          <div className="nes-container is-rounded p-4">
            <h3 className="text-lg font-bold mb-4">
              {hasRequiredTags ? 'Carica Screenshot' : 'Carica Immagine'}
            </h3>

            {selectedPreviewUrl && (
              <div className="mb-4">
                <img
                  src={selectedPreviewUrl}
                  alt="Anteprima"
                  className="max-w-full h-48 object-cover rounded border-2 mx-auto"
                />
              </div>
            )}

            <div className="flex flex-col gap-3">
              <label className="nes-btn is-primary cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                📷 {hasRequiredTags ? 'Scegli Screenshot' : 'Scegli Immagine'}
              </label>
            </div>
          </div>
        ) : (
          <div className="nes-container is-success p-4">
            <h3 className="text-lg font-bold mb-2">🎉 Challenge Completata!</h3>
            <p className="text-sm">
              Hai completato con successo la Social Arena!
            </p>
            {proofPreviewUrl && (
              <div className="mt-4">
                <img
                  src={proofPreviewUrl}
                  alt="Prova completata"
                  className="max-w-full h-32 object-cover rounded border-2"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* OCR Modal for tag verification */}
      {ocrModalOpen && selectedFile && hasRequiredTags && (
        <OcrModal
          file={selectedFile}
          requiredTags={requiredTags}
          confidenceThreshold={confidenceThreshold}
          failedAttempts={failedAttempts}
          onAttempt={() => {
            setFailedAttempts((n) => n + 1);
          }}
          onVerified={async (result, forced) => {
            // Persist proof and update progress if verified or forced
            if (!gameState.currentUser.userId) return;
            try {
              const blobId = await putBlob(selectedFile);

              // Check if ALL required tags meet the confidence threshold
              const tagVerified =
                result?.tagConfidences &&
                requiredTags.length > 0 &&
                requiredTags.every(
                  (tag) =>
                    result.tagConfidences?.[tag] &&
                    typeof result.tagConfidences[tag] === 'number' &&
                    result.tagConfidences[tag] >= confidenceThreshold
                );

              const proof: SocialProof = {
                opId: `proof_${Date.now()}`,
                userId: gameState.currentUser.userId,
                imageLocalUrl: blobId,
                detectedTags: result?.detectedTags || [],
                detected: !!result?.detected,
                // Use per-tag confidence if available, otherwise fallback to general confidence
                verified:
                  forced ||
                  tagVerified ||
                  (!!result?.detected &&
                    result.confidence >= confidenceThreshold),
                attempts: 1,
                createdAt: new Date().toISOString(),
              };

              gameStorage.addSocialProof(gameState.currentUser.userId, proof);
              setProof(proof);

              try {
                const url = await getBlobUrl(blobId);
                setProofPreviewUrl(url || null);
              } catch {}

              if (proof.verified) {
                updateChallengeProgress('social-arena', 1, true);
                setFailedAttempts(0);
                showToast('Challenge Social Arena completata!', 'success');
              } else {
                setFailedAttempts((n) => n + 1);
              }
            } catch (err) {
              console.error('Errore nel salvataggio della prova:', err);
              showToast('Errore nel salvataggio della prova', 'error');
            }

            setOcrModalOpen(false);
          }}
        />
      )}
    </ChallengeContentLayout>
  );
};

export default SocialArena;
