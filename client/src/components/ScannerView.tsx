import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { QRGenerator } from '@/lib/qr';
import { QRData } from '@shared/schema';

const ScannerView: React.FC = () => {
  const { modals, closeModal, openModal, showToast, gameState } = useGameStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const isOpen = modals.scanner?.isOpen;

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      showToast('Impossibile accedere alla fotocamera. Usa "Importa immagine".', 'error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleClose = () => {
    closeModal('scanner');
  };

  const handleImportImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        processImageFile(file);
      }
    };
    input.click();
  };

  const processImageFile = async (file: File) => {
    try {
      setScanning(true);
      
      // For demo purposes, simulate QR detection
      // In a real implementation, this would use a QR scanning library like jsQR
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate finding a QR code - create sample data
      const sampleQRData: QRData = {
        userId: `user_${Date.now()}`,
        displayName: 'Elena Designer',
        avatarUrl: '👩‍💼',
        timestamp: new Date().toISOString(),
      };

      // Check if it's a self-scan
      if (sampleQRData.userId === gameState.currentUser.userId) {
        showToast('Non puoi scansionare il tuo QR', 'error');
        setScanning(false);
        return;
      }

      // Open preview modal with scanned data
      closeModal('scanner');
      openModal('scanPreview', { qrData: sampleQRData });
      
    } catch (error) {
      console.error('Error processing image:', error);
      showToast('QR non valido — riprova o importa immagine.', 'error');
    } finally {
      setScanning(false);
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current || scanning) return;

    try {
      setScanning(true);
      
      // Create canvas to capture frame
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0);
        
        // Convert to blob and process
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            processImageFile(file);
          }
        }, 'image/jpeg', 0.9);
      }
    } catch (error) {
      console.error('Error capturing frame:', error);
      showToast('Errore nella cattura dell\'immagine', 'error');
      setScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="scanner-overlay" data-testid="scanner-view">
      <div className="relative w-full h-full flex flex-col justify-evenly">
        {/* Instructions */}
        <div className="text-center text-white">
          <p className="font-retro text-sm mb-4" data-testid="scanner-instructions">
            Inquadra il QR di un partecipante
          </p>
          {scanning && (
            <p className="text-xs">Scansionando...</p>
          )}
        </div>

        <div className="relative">
          {/* Camera viewport */}
          <video 
            ref={videoRef}
            className="object-cover" 
            autoPlay 
            playsInline
            data-testid="camera-preview"
          />

          {/* Scanner UI overlay */}
          <div className="inset-0 flex items-center justify-center absolute pointer-events-none top-0 left-0 w-full h-full">
            <div className="scanner-viewfinder" data-testid="scanner-viewfinder">
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-yellow-400"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-yellow-400"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-yellow-400"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-yellow-400"></div>
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button 
            className="nes-btn is-error" 
            onClick={handleClose}
            disabled={scanning}
            data-testid="button-close-scanner"
          >
            Annulla
          </button>
          <button 
            className="nes-btn is-primary" 
            onClick={captureFrame}
            disabled={scanning}
            data-testid="button-capture-frame"
          >
            {scanning ? 'Scansionando...' : 'Cattura'}
          </button>
          <button 
            className="nes-btn is-normal" 
            onClick={handleImportImage}
            disabled={scanning}
            data-testid="button-import-image"
          >
            Importa
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScannerView;
