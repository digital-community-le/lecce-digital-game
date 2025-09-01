import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { gameStorage } from '@/lib/storage';
import { UserScan } from '@shared/schema';

const NetworkingForest: React.FC = () => {
  const { gameState, updateChallengeProgress, showToast, openModal } = useGameStore();
  const [scans, setScans] = useState<UserScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const REQUIRED_SCANS = 5;

  useEffect(() => {
    if (gameState.currentUser.userId) {
      const userScans = gameStorage.getScans(gameState.currentUser.userId);
      setScans(userScans);
      setIsLoading(false);
      
      // Update progress based on unique scans
      const uniqueScans = new Set(userScans.map(scan => scan.scannedUserId));
      const progress = uniqueScans.size;
      const completed = progress >= REQUIRED_SCANS;
      
      updateChallengeProgress('networking-forest', progress, completed);
    }
  }, [gameState.currentUser.userId]);

  const handleStartScanner = () => {
    openModal('scanner');
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('it-IT');
  };

  const uniqueScans = scans.reduce((acc, scan) => {
    if (!acc.find(s => s.scannedUserId === scan.scannedUserId)) {
      acc.push(scan);
    }
    return acc;
  }, [] as UserScan[]);

  const progressPercentage = (uniqueScans.length / REQUIRED_SCANS) * 100;

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="title bg-card">Networking Forest</p>
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  return (
    <div>
      <p className="title bg-card">Networking Forest</p>
      
      <div className="p-4">
        {/* Challenge description */}
        <div className="mb-6">
          <h3 className="font-retro text-sm mb-3">La Gemma dell'Alleanza</h3>
          <p className="text-sm mb-4">
            Nel Networking Forest, ogni connessione è un filo di luce che rafforza il tuo cammino. 
            Scansiona i QR degli altri partecipanti per raccogliere la Gemma dell'Alleanza.
          </p>
          <div className="nes-container is-dark p-3 mb-4">
            <p className="text-xs">
              💡 Usa il pulsante per scansionare i QR code degli altri partecipanti. 
              Ogni persona può essere scansionata una sola volta.
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Alleati trovati</span>
            <span data-testid="text-scan-progress">{uniqueScans.length}/{REQUIRED_SCANS}</span>
          </div>
          <div className="progress-custom">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              data-testid="progress-networking"
            ></div>
          </div>
        </div>

        {/* Scanned users list */}
        <div className="mb-6">
          <h4 className="font-retro text-xs mb-3">Alleati scansionati</h4>
          {uniqueScans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-4">🌲</div>
              <p className="text-sm">
                Nessun alleato trovato ancora. Inizia a scansionare i QR degli altri partecipanti!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="scanned-users-list">
              {uniqueScans.map((scan) => (
                <div 
                  key={scan.scannedUserId} 
                  className="nes-container is-light p-3 flex items-center gap-3"
                  data-testid={`scan-card-${scan.scannedUserId}`}
                >
                  <div className="w-12 h-12 bg-muted border-2 border-black flex items-center justify-center text-lg">
                    {scan.scannedAvatarUrl || '👤'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm" data-testid={`scan-name-${scan.scannedUserId}`}>
                      {scan.scannedName || 'Nome non disponibile'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimestamp(scan.scannedAt)}
                    </div>
                  </div>
                  <div className="text-green-600">✓</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action button */}
        {uniqueScans.length < REQUIRED_SCANS && (
          <div className="text-center">
            <button 
              className="nes-btn is-primary"
              onClick={handleStartScanner}
              data-testid="button-start-scanner"
            >
              <span className="mr-2">📱</span>
              Scansiona QR
            </button>
          </div>
        )}

        {/* Completion message */}
        {uniqueScans.length >= REQUIRED_SCANS && (
          <div className="text-center">
            <div className="nes-container is-success p-4 mb-4">
              <div className="text-4xl mb-2">🏆</div>
              <h4 className="font-retro text-sm mb-2">Challenge Completata!</h4>
              <p className="text-sm">
                Hai raccolto tutti gli alleati! La Gemma dell'Alleanza è tua.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkingForest;
