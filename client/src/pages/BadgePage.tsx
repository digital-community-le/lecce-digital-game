import React, { useState, useEffect } from 'react';
import { submitGameCompletion, getDevFestBadge, isDevFestSubmissionSuccessful } from '@/services/completionService';

const BadgePage: React.FC = () => {
  const [badgeInfo, setBadgeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBadge = async () => {
      // Check if we already have a successful DevFest badge
      const existingBadge = getDevFestBadge();
      if (existingBadge) {
        console.log('🏆 DevFest badge already obtained:', existingBadge);
        setBadgeInfo(existingBadge);
        setLoading(false);
        return;
      }

      // If not, try to submit and get the badge
      if (!isDevFestSubmissionSuccessful()) {
        try {
          console.log('🚀 Submitting game completion to DevFest API...');
          const result = await submitGameCompletion();

          if (result.success && result.badge) {
            console.log('🏆 DevFest badge received:', result.badge);
            setBadgeInfo(result.badge);
          } else {
            console.error('❌ Game completion failed:', result.error);
          }
        } catch (e) {
          console.warn('💥 Game completion submission error:', e);
        }
      }
      setLoading(false);
    };

    loadBadge();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 py-12" style={{ background: 'var(--ldc-surface)', color: 'var(--ldc-on-surface)' }}>
        <div className="text-center">
          <div className="nes-container is-rounded is-dark mx-4">
            <p className="font-retro text-xl">Caricamento badge...</p>
            <div className="mt-4">
              <div className="nes-progress">
                <div className="nes-progress-bar" style={{ width: '50%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12" style={{ background: 'var(--ldc-surface)', color: 'var(--ldc-on-surface)' }}>
      <div className="relative w-full max-w-2xl text-center my-8">

        {/* Badge Display */}
        {badgeInfo ? (
          <div className="nes-container is-rounded is-success mx-4 md:mx-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <img
                  src={badgeInfo.picture}
                  alt={badgeInfo.name}
                  className="w-24 h-24 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <h2 className="font-retro text-lg mb-3" style={{ color: 'var(--ldc-success)' }}>
                🏆 BADGE DEVFEST OTTENUTO!
              </h2>
              <p className="font-retro text-sm mb-2">{badgeInfo.name}</p>
              <p className="text-sm opacity-75 mb-4">{badgeInfo.description}</p>
              <p className="text-xs opacity-50">
                Ottenuto: {new Date(badgeInfo.owned).toLocaleDateString('it-IT')}
              </p>
            </div>
          </div>
        ) : (
          <div className="nes-container is-rounded is-error mx-4 md:mx-8">
            <p className="font-retro text-lg">❌ Badge non disponibile</p>
            <p className="text-sm mt-2">Si è verificato un errore nel recupero del badge.</p>
          </div>
        )}

        {/* Return to DevFest Button */}
        <div className="mt-8">
          <a
            href="https://devfest.gdglecce.it"
            target="_blank"
            rel="noopener noreferrer"
            className="nes-btn is-primary font-retro text-lg px-8 py-4 hover:scale-105 transition-transform duration-300"
            style={{
              textShadow: '2px 2px 0px rgba(0,0,0,0.8)',
              boxShadow: '0 8px 0 #4a5568, 0 12px 20px rgba(0,0,0,0.4)',
            }}
          >
            🎉 Torna al DevFest e Continua l'Avventura!
          </a>
        </div>

      </div>
    </div>
  );
};

export default BadgePage;
