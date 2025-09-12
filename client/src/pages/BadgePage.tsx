import React, { useState, useEffect } from 'react';
import {
  submitGameCompletion,
  getDevFestBadge,
  isDevFestSubmissionSuccessful,
  getDevFestSubmissionStatus,
} from '@/services/completionService';
import { gameStorage } from '@/lib/storage';

const BadgePage: React.FC = () => {
  const [badgeInfo, setBadgeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const getErrorMessage = (
    errorText: string
  ): { title: string; message: string } => {
    if (
      errorText.toLowerCase().includes('network') ||
      errorText.toLowerCase().includes('fetch') ||
      errorText.toLowerCase().includes('timeout')
    ) {
      return {
        title: 'Problema di connessione',
        message: 'Verifica la tua connessione internet e riprova.',
      };
    }

    if (
      errorText.toLowerCase().includes('unauthorized') ||
      errorText.toLowerCase().includes('token')
    ) {
      return {
        title: 'Problema di autenticazione',
        message: "La sessione potrebbe essere scaduta. Riavvia l'app DevFest.",
      };
    }

    if (
      errorText.toLowerCase().includes('server') ||
      errorText.toLowerCase().includes('500')
    ) {
      return {
        title: 'Servizio temporaneamente non disponibile',
        message:
          'I server DevFest stanno avendo problemi. Riprova tra qualche minuto.',
      };
    }

    return {
      title: 'Errore nel recupero del badge',
      message: errorText,
    };
  };

  const handleRetry = async () => {
    setRetrying(true);
    setError(null);

    try {
      console.log('🔄 Retrying game completion submission...');
      const result = await submitGameCompletion();

      if (result.success && result.badge) {
        console.log('🏆 Retry successful! Badge received:', result.badge);
        setBadgeInfo(result.badge);
        setError(null);
      } else {
        console.error('❌ Retry failed:', result.error);
        setError(result.error || 'Unknown error during retry');
      }
    } catch (e) {
      console.warn('💥 Retry submission error:', e);
      setError(e instanceof Error ? e.message : 'Retry failed');
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    const loadBadge = async () => {
      console.log('🔍 DEBUG: Starting BadgePage load process...');

      // DEBUG: Check current user
      const lastProfile = gameStorage.getLastProfile();
      const currentUser = lastProfile?.userId || 'anonymous';
      console.log('🧪 DEBUG: Current user ID:', currentUser);

      // DEBUG: Check raw localStorage data
      const rawProgress = localStorage.getItem(`ldc:progress:${currentUser}`);
      console.log('🧪 DEBUG: Raw localStorage data:', rawProgress);

      // STEP 1: First check localStorage for existing badge
      const existingBadge = getDevFestBadge();
      console.log('🧪 DEBUG: getDevFestBadge() returned:', existingBadge);

      if (existingBadge) {
        console.log('✅ Badge found in localStorage:', existingBadge);
        console.log(
          '🧪 DEBUG: Badge.owned value:',
          existingBadge.owned,
          typeof existingBadge.owned
        );
        setBadgeInfo(existingBadge);
        setLoading(false);
        return;
      }

      console.log('❌ No badge found in localStorage');

      // Check if there's a previous failed submission with detailed error info
      const submissionStatus = getDevFestSubmissionStatus();
      if (submissionStatus && !submissionStatus.success) {
        console.log(
          '⚠️ Previous submission failed, showing cached error:',
          submissionStatus.error
        );
        setError(submissionStatus.error || 'Previous submission failed');
        setLoading(false);
        return;
      }

      // STEP 2: No badge in localStorage, make POST API call
      console.log(
        '🚀 No badge in localStorage, making POST request to DevFest API...'
      );
      try {
        const result = await submitGameCompletion();

        if (result.success && result.badge) {
          console.log(
            '🏆 POST successful! Badge received and saved to localStorage:',
            result.badge
          );
          setBadgeInfo(result.badge);
        } else {
          console.error('❌ POST failed:', result.error);
          setError(result.error || 'Game completion failed');
        }
      } catch (e) {
        console.warn('💥 POST request error:', e);
        setError(e instanceof Error ? e.message : 'Submission error');
      }

      setLoading(false);
    };

    loadBadge();
  }, []);

  if (loading || retrying) {
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
            <p className="font-retro text-xl">
              {retrying ? 'Riprovando...' : 'Caricamento badge...'}
            </p>
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
        {badgeInfo && badgeInfo.owned ? (
          <div className="nes-container is-rounded is-success mx-4 md:mx-8 bg-white">
            <div className="flex flex-col items-center text-center">
              <p className="mb-3">Hai ottenuto un nuovo badge!</p>
              <div className="mb-4">
                <img
                  src={badgeInfo.picture}
                  alt={badgeInfo.name}
                  className="w-24 h-24 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <h2
                className="font-retro text-lg mb-3 uppercase"
                style={{ color: 'var(--ldc-success)' }}
              >
                {badgeInfo.name}
              </h2>
              <p
                className="text-sm opacity-75 mb-4"
                style={{ color: 'var(--ldc-on-background)' }}
              >
                {badgeInfo.description}
              </p>
            </div>
          </div>
        ) : (
          <div className="nes-container is-rounded is-error mx-4 md:mx-8">
            {error ? (
              <>
                <div className="mb-4">
                  <p
                    className="font-retro text-lg mb-2"
                    style={{ color: 'var(--ldc-on-background)' }}
                  >
                    Errore nell'attivazione del badge
                  </p>
                  <p
                    className="text-sm mb-2"
                    style={{ color: 'var(--ldc-on-background)' }}
                  >
                    Non è stato possibile attivare il tuo badge DevFest.
                  </p>
                  <p
                    className="font-retro text-base mb-2"
                    style={{ color: 'var(--ldc-on-background)' }}
                  >
                    <strong>{getErrorMessage(error).title}</strong>
                  </p>
                  <p
                    className="text-sm mb-4"
                    style={{ color: 'var(--ldc-on-background)' }}
                  >
                    {getErrorMessage(error).message}
                  </p>

                  {/* Technical details */}
                  <details className="mb-4">
                    <summary className="text-xs cursor-pointer hover:opacity-75">
                      Dettagli tecnici
                    </summary>
                    <div className="mt-2 p-2 bg-black bg-opacity-20 rounded text-xs font-mono">
                      <p>
                        <strong>Errore:</strong> {error}
                      </p>
                      {getDevFestSubmissionStatus() && (
                        <p>
                          <strong>Ultimo tentativo:</strong>{' '}
                          {new Date(
                            getDevFestSubmissionStatus()!.submittedAt
                          ).toLocaleString('it-IT')}
                        </p>
                      )}
                    </div>
                  </details>
                </div>

                {/* Retry Button */}
                <div className="flex justify-center">
                  <button
                    className="nes-btn is-primary"
                    onClick={handleRetry}
                    disabled={retrying}
                  >
                    {retrying ? 'Riprovando...' : 'Riprova'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p
                  className="font-retro text-lg"
                  style={{ color: 'var(--ldc-on-background)' }}
                >
                  Errore nell'attivazione del badge
                </p>
                <p
                  className="text-sm mt-2"
                  style={{ color: 'var(--ldc-on-background)' }}
                >
                  Non è stato possibile attivare il tuo badge DevFest. Si è
                  verificato un errore nel recupero del badge.
                </p>
              </>
            )}
          </div>
        )}

        {/* Return to DevFest Button - Only show when badge is successfully obtained */}
        {badgeInfo && badgeInfo.owned && (
          <div className="mt-8">
            <p className="nes-balloon from-left text-gray-500">
              Torna all'app DevFest Lecce e continua l'Avventura!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BadgePage;
