import React, { useState, useEffect } from 'react';
import {
  submitGameCompletion,
  getDevFestBadge,
  isDevFestSubmissionSuccessful,
} from '@/services/completionService';

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
      <div
        className="p-4"
        style={{
          background: 'var(--ldc-background)',
          color: 'var(--ldc-on-background)',
        }}
      >
        <div className="container mx-auto max-w-2xl text-center">
          <div className="nes-container is-rounded is-dark mx-4">
            <p className="font-retro text-xl">Caricamento badge...</p>
            <div className="mt-4">
              <div className="nes-progress">
                <div
                  className="nes-progress-bar"
                  style={{ width: '50%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4"
      style={{
        background: 'var(--ldc-background)',
        color: 'var(--ldc-on-background)',
      }}
    >
      <div className="container mx-auto max-w-2xl text-center">
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
              <h2
                className="font-retro text-lg mb-3"
                style={{ color: 'var(--ldc-success)' }}
              >
                Badge COMMUNITY ottenuto!
              </h2>
              <p
                className="font-retro text-sm mb-2"
                style={{ color: 'var(--ldc-on-background)' }}
              >
                {badgeInfo.name}
              </p>
              <p
                className="text-sm opacity-75 mb-4"
                style={{ color: 'var(--ldc-on-background)' }}
              >
                {badgeInfo.description}
              </p>
              <p
                className="text-xs opacity-50"
                style={{ color: 'var(--ldc-on-background)' }}
              >
                Ottenuto:{' '}
                {new Date(badgeInfo.owned).toLocaleDateString('it-IT')}
              </p>
            </div>
          </div>
        ) : (
          <div className="nes-container is-rounded is-error mx-4 md:mx-8">
            <p
              className="font-retro text-lg"
              style={{ color: 'var(--ldc-on-background)' }}
            >
              Badge non disponibile
            </p>
            <p
              className="text-sm mt-2"
              style={{ color: 'var(--ldc-on-background)' }}
            >
              Si è verificato un errore nel recupero del badge.
            </p>
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
            Torna all'app DevFest Lecce e Continua l'Avventura!
          </a>
        </div>
      </div>
    </div>
  );
};

export default BadgePage;
