import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { gameStorage } from '@/lib/storage';
import { SocialProof } from '@shared/schema';

const SocialArena: React.FC = () => {
  const { gameState, updateChallengeProgress, showToast } = useGameStore();
  const [proofs, setProofs] = useState<SocialProof[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const REQUIRED_TAG = '@lecce_digital';

  useEffect(() => {
    if (gameState.currentUser.userId) {
      const userProofs = gameStorage.getSocialProofs(gameState.currentUser.userId);
      setProofs(userProofs);
      setIsLoading(false);
      
      // Check if challenge is completed
      const validProof = userProofs.find(proof => proof.detected && proof.verified);
      if (validProof) {
        updateChallengeProgress('social-arena', 1, true);
      }
    }
  }, [gameState.currentUser.userId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    } else {
      showToast('Seleziona un\'immagine valida', 'error');
    }
  };

  const handleTakePicture = () => {
    // Create a file input for camera capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedFile(file);
      }
    };
    input.click();
  };

  const simulateOCR = async (imageUrl: string): Promise<{ detectedTags: string[]; detected: boolean }> => {
    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate OCR results - in a real implementation, this would use Tesseract.js
    const hasRequiredTag = Math.random() > 0.3; // 70% chance of detecting the tag for demo
    
    return {
      detectedTags: hasRequiredTag ? [REQUIRED_TAG, '#devfest', '#lecce'] : ['#devfest', '#lecce'],
      detected: hasRequiredTag,
    };
  };

  const handleUpload = async () => {
    if (!selectedFile || !gameState.currentUser.userId) return;

    setIsUploading(true);
    setIsAnalyzing(true);

    try {
      // Create object URL for the image
      const imageLocalUrl = URL.createObjectURL(selectedFile);
      
      // Simulate OCR processing
      const ocrResult = await simulateOCR(imageLocalUrl);
      
      // Create social proof
      const proof: SocialProof = {
        opId: `proof_${Date.now()}`,
        userId: gameState.currentUser.userId,
        imageLocalUrl,
        detectedTags: ocrResult.detectedTags,
        detected: ocrResult.detected,
        verified: ocrResult.detected, // Auto-verify if detected for demo
        attempts: 1,
        createdAt: new Date().toISOString(),
      };

      // Save proof
      gameStorage.addSocialProof(gameState.currentUser.userId, proof);
      setProofs(prev => [...prev, proof]);
      
      if (proof.detected) {
        updateChallengeProgress('social-arena', 1, true);
        showToast('Tag rilevato! Prova verificata con successo!', 'success');
      } else {
        showToast('Tag non rilevato nell\'immagine. Riprova con un\'immagine più chiara.', 'warning');
      }
      
    } catch (error) {
      console.error('Error processing image:', error);
      showToast('Errore nell\'elaborazione dell\'immagine', 'error');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
      setSelectedFile(null);
    }
  };

  const latestProof = proofs[proofs.length - 1];
  const isCompleted = proofs.some(proof => proof.detected && proof.verified);

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
      <p className="title bg-card">Social Arena</p>
      
      <div className="p-4">
        {/* Challenge description */}
        <div className="mb-6">
          <h3 className="font-retro text-sm mb-3">La Prova Finale</h3>
          <p className="text-sm mb-4">
            Davanti allo Stand, il tuo gesto diventa simbolo: cattura la foto con il gadget e attiva l'epilogo della leggenda.
          </p>
          <div className="nes-container is-dark p-3 mb-4">
            <p className="text-xs">
              💡 Scatta la foto al gadget nello stand; lascia che la comunità veda la tua impresa. 
              Il sistema rileverà automaticamente il tag {REQUIRED_TAG}.
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progressione</span>
            <span data-testid="text-social-progress">{isCompleted ? '1/1' : '0/1'}</span>
          </div>
          <div className="progress-custom">
            <div 
              className="progress-fill" 
              style={{ width: isCompleted ? '100%' : '0%' }}
              data-testid="progress-social"
            ></div>
          </div>
        </div>

        {!isCompleted ? (
          <>
            {/* Upload area */}
            <div className="border-4 border-dashed border-muted-foreground p-8 text-center mb-6">
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="text-4xl">📸</div>
                  <p className="text-sm">Immagine selezionata: {selectedFile.name}</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <button 
                      className="nes-btn is-primary"
                      onClick={handleUpload}
                      disabled={isUploading}
                      data-testid="button-upload-image"
                    >
                      {isUploading ? 'Caricamento...' : 'Carica e analizza'}
                    </button>
                    <button 
                      className="nes-btn is-normal"
                      onClick={() => setSelectedFile(null)}
                      disabled={isUploading}
                      data-testid="button-cancel-upload"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-4xl">📸</div>
                  <p className="text-sm mb-4">Carica la foto con il gadget della community</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <button 
                      className="nes-btn is-primary"
                      onClick={handleTakePicture}
                      data-testid="button-take-picture"
                    >
                      Scatta foto
                    </button>
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
            </div>

            {/* OCR Analysis Status */}
            {isAnalyzing && (
              <div className="nes-container is-light p-4 mb-6 text-center">
                <div className="text-2xl mb-2">🔍</div>
                <p className="text-sm">Analizzo l'immagine...</p>
                <p className="text-xs text-muted-foreground">Ricerco il tag {REQUIRED_TAG}</p>
              </div>
            )}

            {/* Latest proof result */}
            {latestProof && !isAnalyzing && (
              <div className="mb-6">
                <h4 className="font-retro text-xs mb-3">Ultimo risultato</h4>
                <div className={`nes-container p-3 ${latestProof.detected ? 'is-success' : 'is-error'}`}>
                  <div className="flex items-start gap-3">
                    <img 
                      src={latestProof.imageLocalUrl} 
                      alt="Prova caricata" 
                      className="w-16 h-16 object-cover border-2 border-black"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">
                        {latestProof.detected ? 'Tag rilevato!' : 'Tag non trovato'}
                      </p>
                      <p className="text-xs mb-2">
                        Tag trovati: {latestProof.detectedTags.join(', ') || 'Nessuno'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(latestProof.createdAt).toLocaleString('it-IT')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="nes-container is-light p-3">
              <p className="text-xs">
                <strong>Istruzioni:</strong> Cerca il gadget ufficiale LecceDigital allo stand e includilo nella foto. 
                Il sistema rileverà automaticamente i tag della community per verificare la tua partecipazione.
              </p>
            </div>
          </>
        ) : (
          /* Completion message */
          <div className="text-center">
            <div className="nes-container is-success p-4 mb-4">
              <div className="text-4xl mb-2">🏆</div>
              <h4 className="font-retro text-sm mb-2">Arena Conquistata!</h4>
              <p className="text-sm mb-3">
                La tua prova è stata verificata! La leggenda del Sigillo è ora completa.
              </p>
              {latestProof && (
                <div className="nes-container is-light p-3">
                  <div className="flex items-center gap-3 justify-center">
                    <img 
                      src={latestProof.imageLocalUrl} 
                      alt="Prova verificata" 
                      className="w-12 h-12 object-cover border-2 border-black"
                    />
                    <div className="text-xs text-left">
                      <div>Tag rilevati: {latestProof.detectedTags.join(', ')}</div>
                      <div>Verificato: {new Date(latestProof.createdAt).toLocaleString('it-IT')}</div>
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
