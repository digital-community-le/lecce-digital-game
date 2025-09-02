import React from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import UiDialog from '@/components/UiDialog';
import { QRGenerator } from '@/lib/qr';

const QRModal: React.FC = () => {
  const { modals, closeModal, gameState, showToast } = useGameStore();
  const isOpen = modals.qr?.isOpen;

  const handleDownload = async () => {
    if (gameState.currentUser.qrData) {
      try {
        await QRGenerator.downloadQR(
          gameState.currentUser.qrData,
          `${gameState.currentUser.displayName}-qr.png`
        );
        showToast('QR scaricato con successo!', 'success');
      } catch (error) {
        showToast('Errore nel download del QR', 'error');
      }
    }
  };

  const handleClose = () => {
    closeModal('qr');
  };

  if (!isOpen) return null;

  return (
    <UiDialog open={isOpen} onClose={() => closeModal('qr')} title="Il tuo QR" className="max-w-md">
      <div className="text-center p-4" data-testid="modal-qr">
        {/* User info */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-16 h-16 bg-muted border-2 border-black flex items-center justify-center overflow-hidden">
            <img 
              src={gameState.currentUser.avatar} 
              alt="Avatar utente"
              className="w-full h-full object-cover pixelated"
            />
          </div>
          <div>
            <div className="font-retro text-sm" data-testid="text-user-name">
              {gameState.currentUser.displayName}
            </div>
            <div className="text-xs text-muted-foreground" data-testid="text-user-timestamp">
              {new Date().toLocaleDateString('it-IT')} {new Date().toLocaleTimeString('it-IT')}
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white border-4 border-black p-4 mb-4 inline-block">
          {gameState.currentUser.qrData ? (
            <img 
              src={gameState.currentUser.qrData} 
              alt="QR Code" 
              className="w-48 h-48"
              data-testid="img-qr-code"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">QR non disponibile</span>
            </div>
          )}
        </div>

        {/* Action buttons: only Download and Close are needed */}
        <div className="flex gap-2 justify-center flex-wrap">
          <button 
            className="nes-btn is-primary" 
            onClick={handleDownload}
            disabled={!gameState.currentUser.qrData}
            data-testid="button-download-qr"
          >
            Scarica
          </button>
          <button 
            className="nes-btn is-normal" 
            onClick={handleClose}
            data-testid="button-close-qr"
          >
            Chiudi
          </button>
        </div>
      </div>
    </UiDialog>
  );
};

export default QRModal;

