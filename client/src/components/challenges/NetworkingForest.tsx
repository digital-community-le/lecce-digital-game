import React, { useEffect } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { gameStorage } from '@/lib/storage';
import { UserScan } from '@shared/schema';
import gameData from '@/assets/game-data.json';
import ChallengeContentLayout from '@/components/layout/ChallengeContentLayout';
import AllianceGemIcon from '@assets/images/gem-of-alliance.png'


const NetworkingForest: React.FC = () => {
  const { gameState, updateChallengeProgress, showToast, openModal } = useGameStore();

  // Load static configuration for this challenge from game-data.json
  const challengeConfig = Array.isArray((gameData as any).challenges)
    ? (gameData as any).challenges.find((c: any) => c.id === 'networking-forest')
    : undefined;

  const REQUIRED_SCANS = challengeConfig?.requirements?.minDistinctScans ?? 5;

  // Read scans from persistent storage on every render so UI reflects the latest state
  const scans = gameState.currentUser.userId
    ? gameStorage.getScans(gameState.currentUser.userId)
    : [];

  // Update progress in the global store based on current scans
  useEffect(() => {
    if (gameState.currentUser.userId) {
      const uniqueScansSet = new Set(scans.map(s => s.scannedUserId));
      const progress = uniqueScansSet.size;
      const completed = progress >= REQUIRED_SCANS;
      updateChallengeProgress('networking-forest', progress, completed);
    }
  // Re-run when scans or userId change
  }, [gameState.currentUser.userId, scans.length]);

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

  // Prefer reactive progress from gameState.challenges (updated by updateChallengeProgress)
  const challenge = gameState.challenges.find(c => c.id === 'networking-forest');
  const progressCount = typeof challenge?.progress === 'number' ? challenge.progress : uniqueScans.length;
  const totalRequired = challenge?.total ?? REQUIRED_SCANS;

  const description = challengeConfig?.description ?? "Nel Networking Forest, ogni connessione è un filo di luce che rafforza il tuo cammino. Scansiona i QR degli altri partecipanti per raccogliere la Gemma dell'Alleanza.";
  const tip = challengeConfig?.tip ?? "Usa il pulsante per scansionare i QR code degli altri partecipanti. Ogni persona può essere scansionata una sola volta.";
  const rewardBadge = challengeConfig?.rewards?.badge ?? "La Gemma dell'Alleanza";

  return (
    <ChallengeContentLayout
      gemTitle={rewardBadge}
      gemIcon={AllianceGemIcon}
      description={description}
      tip={tip}
      progress={progressCount}
      total={totalRequired}
      progressLabel="Alleati trovati"
      isCompleted={progressCount >= totalRequired}
      completionMessage="Hai raccolto tutti gli alleati! La Gemma dell'Alleanza è tua."
    >

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
                <div className="w-12 h-12 bg-muted border-2 border-black flex items-center justify-center overflow-hidden">
                  {scan.scannedAvatarUrl ? (
                    <img 
                      src={scan.scannedAvatarUrl} 
                      alt="Avatar" 
                      className="w-full h-full object-cover pixelated"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xs">?</div>
                  )}
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

        {/* Action button */}
        {uniqueScans.length < totalRequired && (
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
      </div>
    </ChallengeContentLayout>
  );
};

export default NetworkingForest;
