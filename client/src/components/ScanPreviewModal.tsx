import React from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import UiDialog from '@/components/UiDialog';
import { gameStorage } from '@/lib/storage';
import { UserScan } from '@shared/schema';

const ScanPreviewModal: React.FC = () => {
  const { modals, closeModal, showToast, gameState, updateChallengeProgress, openModal } = useGameStore();
  const isOpen = modals.scanPreview?.isOpen;
  const qrData = modals.scanPreview?.data?.qrData;

  const handleConfirm = () => {
    if (!qrData || !gameState.currentUser.userId) return;

    // Check for duplicate scan
    const existingScans = gameStorage.getScans(gameState.currentUser.userId);
    const isDuplicate = existingScans.some(scan => scan.scannedUserId === qrData.userId);

    if (isDuplicate) {
      showToast('Hai già scansionato questo partecipante', 'warning');
      closeModal('scanPreview');
      return;
    }

    // Create new scan
    const newScan: UserScan = {
      opId: `scan_${Date.now()}`,
      scannedUserId: qrData.userId,
      scannedName: qrData.displayName,
      scannedAvatarUrl: qrData.avatarUrl,
      scannedAt: new Date().toISOString(),
      source: 'qr',
      verified: true,
    };

    // Save scan
    gameStorage.addScan(gameState.currentUser.userId, newScan);
    
    // Update progress
    const allScans = gameStorage.getScans(gameState.currentUser.userId);
    const uniqueScans = new Set(allScans.map(scan => scan.scannedUserId));
    const progress = uniqueScans.size;
    const completed = progress >= 5; // REQUIRED_SCANS from NetworkingForest

    updateChallengeProgress('networking-forest', progress, completed);
    
    showToast('Scansione completata con successo!', 'success');
    closeModal('scanPreview');

    if (completed) {
      setTimeout(() => {
        openModal('completion', { 
          challengeId: 'networking-forest',
          title: 'Gemma dell\'Alleanza',
          description: 'Hai raccolto 5 alleati nel Networking Forest! La Gemma dell\'Alleanza ora illumina il tuo cammino.',
          score: 150,
          time: '2:34'
        });
      }, 500);
    }
  };

  const handleCancel = () => {
    closeModal('scanPreview');
  };

  if (!isOpen || !qrData) return null;

  return (
    <UiDialog open={isOpen} onClose={() => closeModal('scanPreview')} title="Partecipante scansionato" className="max-w-md">
      <div className="text-center p-4" data-testid="modal-scan-preview">
        {/* Scanned user info */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-16 h-16 bg-muted border-2 border-black flex items-center justify-center text-2xl">
            {qrData.avatarUrl || '👤'}
          </div>
          <div>
            <div className="font-retro text-sm" data-testid="text-scanned-user-name">
              {qrData.displayName}
            </div>
            <div className="text-xs text-muted-foreground" data-testid="text-scanned-user-timestamp">
              {new Date(qrData.timestamp).toLocaleString('it-IT')}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 justify-center flex-wrap">
          <button 
            className="nes-btn is-primary" 
            onClick={handleConfirm}
            data-testid="button-confirm-scan"
          >
            Conferma
          </button>
          <button 
            className="nes-btn is-normal" 
            onClick={handleCancel}
            data-testid="button-cancel-scan"
          >
            Annulla
          </button>
        </div>
      </div>
    </UiDialog>
  );
};

export default ScanPreviewModal;
