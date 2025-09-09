import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { gameStorage } from '@/lib/storage';
import { GuildState, GuildCompanion } from '@shared/schema';
import ChallengeContentLayout from '@/components/layout/ChallengeContentLayout';
import ChallengeCompleted from '@/components/ChallengeCompleted';
import CompanionSlot from './CompanionSlot';
import UiDialog from '@/components/UiDialog';
import gameData from '@/assets/game-data.json';
import allianceGem from '@assets/images/gem-of-alliance.png';
import AliceAvatar from '@assets/avatars/female_designer.png';
import BobAvatar from '@assets/avatars/male_designer.png';
import CharlieAvatar from '@assets/avatars/male_manager.png';
import DavidAvatar from '@assets/avatars/male_developer.png';
import EveAvatar from '@assets/avatars/female_manager.png';
import FrankAvatar from '@assets/avatars/male_scientist.png';
import GraceAvatar from '@assets/avatars/female_developer.png';
import HenryAvatar from '@assets/avatars/male_designer.png';

// Load configuration for guild-builder from game-data.json
const guildBuilderConfig = Array.isArray((gameData as any).challenges)
  ? (gameData as any).challenges.find((c: any) => c.id === 'guild-builder')
  : undefined;

const companions: GuildCompanion[] = [
  {
    id: '1',
    name: 'Alice',
    role: 'Social Media Wizard',
    description: 'Esperta nel connettere persone e comunità online',
    avatar: AliceAvatar,
  },
  {
    id: '2',
    name: 'Bob',
    role: 'Designer',
    description: 'Crea esperienze visive memorabili e innovative',
    avatar: BobAvatar,
  },
  {
    id: '3',
    name: 'Charlie',
    role: 'Speaker',
    description: 'Comunica idee complesse con chiarezza e passione',
    avatar: CharlieAvatar,
  },
  {
    id: '4',
    name: 'David',
    role: 'Developer',
    description: 'Costruisce soluzioni tecniche robuste e scalabili',
    avatar: DavidAvatar,
  },
  {
    id: '5',
    name: 'Eve',
    role: 'Project Manager',
    description: 'Coordina team e progetti con efficienza strategica',
    avatar: EveAvatar,
  },
  {
    id: '6',
    name: 'Frank',
    role: 'Tester',
    description: 'Garantisce qualità e affidabilità in ogni dettaglio',
    avatar: FrankAvatar,
  },
  {
    id: '7',
    name: 'Grace',
    role: 'Marketing Expert',
    description: 'Trasforma prodotti in storie che coinvolgono',
    avatar: GraceAvatar,
  },
  {
    id: '8',
    name: 'Henry',
    role: 'Content Creator',
    description: 'Produce contenuti che educano e ispirano',
    avatar: HenryAvatar,
  },
];

/**
 * Mapping dei suggerimenti per ruoli errati basato sui requisiti della quest
 */
export const getSuggestion = (
  wrongRole: string,
  requiredRoles: string[],
  questText: string,
  selectedRoles: string[]
): string => {
  // Analisi del testo della quest per fornire suggerimenti contestuali
  const lowerQuestText = questText.toLowerCase();

  // Mappatura specifica per ruoli errati vs ruoli richiesti
  const roleSuggestions: Record<string, Record<string, string>> = {
    Developer: {
      'Social Media Wizard': 'per gestire la visibilità sui social',
      Designer: 'per creare contenuti visivi accattivanti',
      Speaker: 'per comunicare efficacemente con il pubblico',
      'Marketing Expert': 'per promuovere il progetto',
      'Content Creator': 'per produrre contenuti coinvolgenti',
    },
    Designer: {
      Developer: 'per risolvere problemi tecnici e bug',
      Tester: 'per garantire la qualità del software',
      'Project Manager': 'per coordinare il team efficacemente',
      'Social Media Wizard': 'per la gestione dei social media',
    },
    Tester: {
      Developer: 'per implementare nuove funzionalità',
      Designer: "per migliorare l'aspetto visivo",
      Speaker: 'per presentare il progetto',
      'Social Media Wizard': 'per aumentare la visibilità online',
    },
    'Project Manager': {
      Developer: 'per le competenze tecniche necessarie',
      'Social Media Wizard': 'per la strategia sui social media',
      Designer: "per l'aspetto creativo del progetto",
      Speaker: 'per la comunicazione pubblica',
    },
    'Marketing Expert': {
      'Social Media Wizard': 'per la gestione specifica dei social',
      'Content Creator': 'per la creazione di contenuti',
      Developer: 'per le competenze tecniche',
      Designer: 'per la parte visiva',
    },
    'Content Creator': {
      'Social Media Wizard': 'per la strategia sui social media',
      Designer: 'per la creatività visiva',
      Speaker: 'per la comunicazione diretta',
      'Marketing Expert': 'per la strategia di marketing',
    },
    'Social Media Wizard': {
      Developer: 'per risolvere problemi tecnici',
      Tester: "per testare l'applicazione",
      'Project Manager': 'per gestire il progetto',
      Designer: 'per la parte creativa',
    },
    Speaker: {
      Developer: 'per le competenze tecniche',
      Designer: "per l'aspetto visivo",
      'Social Media Wizard': 'per i social media',
      Tester: 'per il controllo qualità',
    },
  };

  // Trova il primo ruolo richiesto che non è quello sbagliato e non è già selezionato
  const suggestedRole = requiredRoles.find(
    (role) => role !== wrongRole && !selectedRoles.includes(role)
  );

  if (suggestedRole && roleSuggestions[wrongRole]?.[suggestedRole]) {
    const reason = roleSuggestions[wrongRole][suggestedRole];
    return `Hai scelto un ${wrongRole} in gamba, ma purtroppo non può esserti utile per questa missione. Sicuramente un ${suggestedRole} sarebbe più adatto ${reason}.`;
  }

  // Fallback generico
  return `Hai scelto un ${wrongRole} di talento, ma per questa quest avresti bisogno di competenze diverse. Prova con un altro profilo!`;
};

const GuildBuilder: React.FC = () => {
  const { gameState, updateChallengeProgress, showToast } = useGameStore();
  const [guildState, setGuildState] = useState<GuildState | null>(null);
  const [selectedCompanions, setSelectedCompanions] = useState<
    (GuildCompanion | null)[]
  >([null, null, null]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<string>('');
  const [pointsLost, setPointsLost] = useState<number>(0);

  // Configuration validation
  if (!guildBuilderConfig) {
    return (
      <div>
        <p className="title bg-card">Guild Builder — Errore</p>
        <div className="text-center text-red-600 mt-4">
          Configurazione della challenge "guild-builder" non trovata in{' '}
          <code>game-data.json</code>.
        </div>
      </div>
    );
  }

  const requiredRoles =
    guildBuilderConfig.requirements?.requirement?.roles || [];
  const questText = guildBuilderConfig.requirements?.requirement?.text || '';
  const TEAM_SIZE = 3; // Fixed team size

  // Scoring configuration
  const scoringConfig = guildBuilderConfig.settings?.scoring || {
    maxScore: 100,
    penaltyPerFailure: 25,
    minScore: 0,
    deductOnRetry: true,
  };

  useEffect(() => {
    if (gameState.currentUser.userId) {
      let state = gameStorage.getGuildState(gameState.currentUser.userId);

      if (!state) {
        // Initialize new guild state with scoring
        state = {
          id: `guild_${Date.now()}`,
          team: {},
          completed: false,
          attempts: 0,
          startedAt: new Date().toISOString(),
          currentScore: scoringConfig.maxScore,
          maxScore: scoringConfig.maxScore,
          penaltyPerFailure: scoringConfig.penaltyPerFailure,
          minScore: scoringConfig.minScore,
        };

        gameStorage.saveGuildState(gameState.currentUser.userId, state);
      } else if (state.currentScore === undefined) {
        // Migrate existing state to include scoring
        state = {
          ...state,
          currentScore: scoringConfig.maxScore,
          maxScore: scoringConfig.maxScore,
          penaltyPerFailure: scoringConfig.penaltyPerFailure,
          minScore: scoringConfig.minScore,
        };

        gameStorage.saveGuildState(gameState.currentUser.userId, state);
      }

      // Convert team object to selectedCompanions array with null placeholders
      const newSelectedCompanions: (GuildCompanion | null)[] = [
        null,
        null,
        null,
      ];
      Object.values(state.team)
        .filter(
          (companion) =>
            companion && companion.id && companion.name && companion.role
        )
        .forEach((companion, index) => {
          if (index < 3) {
            newSelectedCompanions[index] = companion as GuildCompanion;
          }
        });

      // If no team is saved, randomize initial selection
      if (Object.keys(state.team).length === 0) {
        const shuffledCompanions = [...companions].sort(
          () => Math.random() - 0.5
        );
        for (let i = 0; i < 3; i++) {
          newSelectedCompanions[i] = shuffledCompanions[i];
        }
      }

      setSelectedCompanions(newSelectedCompanions);
      setGuildState(state);
      setIsLoading(false);
    }
  }, [gameState.currentUser.userId, scoringConfig]);

  const handleCompanionChange = (
    slotIndex: number,
    companion: GuildCompanion | null
  ) => {
    const newSelected = [...selectedCompanions];
    newSelected[slotIndex] = companion;
    setSelectedCompanions(newSelected);

    // Clear suggestion dialog when user changes selection
    if (showSuggestionDialog) {
      setShowSuggestionDialog(false);
      setCurrentSuggestion('');
    }
  };

  const getAvailableCompanions = (forSlotIndex: number): GuildCompanion[] => {
    const usedIds = selectedCompanions
      .filter((comp, index) => comp !== null && index !== forSlotIndex)
      .map((comp) => comp!.id);

    return companions.filter((comp) => !usedIds.includes(comp.id));
  };

  const handleSubmit = () => {
    if (!guildState) return;

    const validCompanions = selectedCompanions.filter(
      (c) => c !== null
    ) as GuildCompanion[];

    // Update guild state with current selection
    const newTeam: Record<string, GuildCompanion> = {};
    validCompanions.forEach((comp, index) => {
      newTeam[`slot_${index}`] = comp;
    });

    // Check if the selected team has the required roles
    const selectedRoles = validCompanions.map((c) => c.role);
    const hasAllRequiredRoles = requiredRoles.every((role: string) =>
      selectedRoles.includes(role)
    );

    const newAttempts = guildState.attempts + 1;
    const currentScore = guildState.currentScore || scoringConfig.maxScore;

    if (hasAllRequiredRoles) {
      const updatedState: GuildState = {
        ...guildState,
        completed: true,
        attempts: newAttempts,
        finishedAt: new Date().toISOString(),
        score: currentScore, // Final score
      };

      setGuildState(updatedState);
      gameStorage.saveGuildState(gameState.currentUser.userId, updatedState);
      updateChallengeProgress('guild-builder', 1, true);
      // Clear suggestion dialog on success
      setShowSuggestionDialog(false);
      setCurrentSuggestion('');
      setPointsLost(0);
    } else {
      // Calculate score reduction
      const penalty =
        guildState.penaltyPerFailure || scoringConfig.penaltyPerFailure;
      const minScore = guildState.minScore || scoringConfig.minScore;
      const actualPointsLost = Math.min(
        penalty,
        Math.max(0, currentScore - minScore)
      );
      const newScore = Math.max(minScore, currentScore - actualPointsLost);

      // Generate suggestion for the first wrong role found
      const wrongRoles = selectedRoles.filter(
        (role) => !requiredRoles.includes(role)
      );
      const firstWrongRole = wrongRoles[0]; // Show only the first wrong role

      if (firstWrongRole) {
        const suggestion = getSuggestion(
          firstWrongRole,
          requiredRoles,
          questText,
          selectedRoles
        );
        setCurrentSuggestion(suggestion);
        setPointsLost(actualPointsLost);
        setShowSuggestionDialog(true);
        // Don't show toast when dialog is displayed
      } else {
        // Fallback case - no wrong roles found but still not matching (shouldn't happen)
        showToast('La squadra non soddisfa i requisiti della quest.', 'error');
      }

      const updatedState: GuildState = {
        ...guildState,
        attempts: newAttempts,
        currentScore: newScore,
      };

      setGuildState(updatedState);
      gameStorage.saveGuildState(gameState.currentUser.userId, updatedState);
    }
  };

  const handleCloseSuggestion = () => {
    setShowSuggestionDialog(false);
    setCurrentSuggestion('');
    setPointsLost(0);
  };

  const handleReturnToMap = () => {
    // Navigate back to the map
    window.location.href = '/';
  };

  if (isLoading || !guildState) {
    return (
      <div>
        <p className="title bg-card">Guild Builder</p>
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  const isCompleted = guildState.completed;
  const currentScore = guildState.currentScore || scoringConfig.maxScore;
  const maxScore = guildState.maxScore || scoringConfig.maxScore;

  return (
    <ChallengeContentLayout
      gemTitle="La Gemma dell'Alleanza"
      gemIcon={allianceGem}
      description={guildBuilderConfig.description}
      tip={`Seleziona ${TEAM_SIZE} compagni che possano affrontare insieme la quest. Scegli con saggezza!`}
      isCompleted={isCompleted}
      completionMessage="Hai formato la squadra perfetta! La Gemma dell'Alleanza è tua."
    >
      {!isCompleted ? (
        <div className="flex flex-col gap-6">
          {/* Quest display */}
          <div className="nes-container is-rounded with-title bg-white">
            <h4 className="title font-retro text-base">Quest</h4>
            <p>{questText}</p>
          </div>

          {/* Companion Slots */}
          <div className="mb-6">
            <h3
              className="font-retro text-sm mb-4 text-center"
              style={{ color: '#212529' }}
            >
              Forma la tua squadra
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: TEAM_SIZE }, (_, index) => (
                <CompanionSlot
                  key={`slot-${index}`}
                  slotIndex={index}
                  availableCompanions={getAvailableCompanions(index)}
                  currentCompanion={selectedCompanions[index]}
                  onCompanionChange={(companion) =>
                    handleCompanionChange(index, companion)
                  }
                  disabled={isCompleted}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="text-center space-x-4">
            <button
              className="nes-btn is-primary"
              onClick={handleSubmit}
              disabled={
                selectedCompanions.filter((c) => c !== null).length !==
                TEAM_SIZE
              }
              data-testid="button-submit-team"
              style={{
                backgroundColor:
                  selectedCompanions.filter((c) => c !== null).length ===
                  TEAM_SIZE
                    ? '#0d6efd'
                    : '#6c757d',
                borderColor:
                  selectedCompanions.filter((c) => c !== null).length ===
                  TEAM_SIZE
                    ? '#0a58ca'
                    : '#5c636a',
              }}
            >
              Conferma Squadra
            </button>
          </div>
        </div>
      ) : (
        <ChallengeCompleted
          title="Gemma dell'Alleanza Conquistata!"
          message="Hai formato la squadra giusta per affrontare la sfida: la Gemma dell'Alleanza è tua. Il tuo gruppo ha dimostrato sinergia e solidarietà."
          emoji="🛡️"
        >
          <div
            className="nes-container is-light p-3 mb-3"
            style={{ backgroundColor: '#e7f3ff', border: '3px solid #0d6efd' }}
          >
            <div className="text-sm" style={{ color: '#212529' }}>
              <div className="flex justify-between">
                <span>Squadra formata:</span>
                <span className="font-retro">
                  {selectedCompanions.filter((c) => c !== null).length}/
                  {TEAM_SIZE}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tentativi totali:</span>
                <span>{guildState.attempts}</span>
              </div>
              <div className="flex justify-between">
                <span>Punteggio finale:</span>
                <span className="font-retro text-green-600">
                  {guildState.score || currentScore}/{maxScore}
                </span>
              </div>
            </div>
          </div>
        </ChallengeCompleted>
      )}

      {/* Suggestion Dialog */}
      <UiDialog
        open={showSuggestionDialog}
        onClose={handleCloseSuggestion}
        title="💡 Quasi… ma non è la squadra giusta"
        rounded={true}
        ariaLabelledBy="suggestion-dialog-title"
        ariaDescribedBy="suggestion-dialog-content"
      >
        <div id="suggestion-dialog-content">
          <p className="text-sm mb-4" style={{ color: '#856404' }}>
            {currentSuggestion}
          </p>

          {/* Score feedback */}
          {pointsLost > 0 && (
            <div
              className="nes-container is-light p-3 mb-4"
              style={{
                backgroundColor: '#fff3cd',
                border: '2px solid #ffc107',
              }}
            >
              <div className="text-sm text-center" style={{ color: '#856404' }}>
                <div className="mb-1">
                  <span className="font-retro text-red-600">
                    -{pointsLost} punti
                  </span>
                </div>
                <div>
                  Punti rimanenti:{' '}
                  <span className="font-retro">
                    {currentScore - pointsLost}/{maxScore}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="text-center space-x-3">
            <button
              className="nes-btn is-primary"
              onClick={handleCloseSuggestion}
              style={{
                backgroundColor: '#0d6efd',
                borderColor: '#0a58ca',
              }}
            >
              Riprova
            </button>
            <button
              className="nes-btn"
              onClick={handleReturnToMap}
              style={{
                backgroundColor: '#6c757d',
                borderColor: '#5c636a',
                color: 'white',
              }}
            >
              Torna alla mappa
            </button>
          </div>
        </div>
      </UiDialog>
    </ChallengeContentLayout>
  );
};

export default GuildBuilder;
