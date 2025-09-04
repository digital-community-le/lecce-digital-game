import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/use-game-store';
import { gameStorage } from '@/lib/storage';
import { GuildState, GuildCompanion } from '@shared/schema';
import ChallengeContentLayout from '@/components/layout/ChallengeContentLayout';
import ChallengeCompleted from '@/components/ChallengeCompleted';
import gameData from '@/assets/game-data.json';
import allianceGem from '@assets/images/gem-of-alliance.png';

// Load configuration for guild-builder from game-data.json
const guildBuilderConfig = Array.isArray((gameData as any).challenges)
  ? (gameData as any).challenges.find((c: any) => c.id === 'guild-builder')
  : undefined;

const companions: GuildCompanion[] = [
  { id: '1', name: 'Alice', role: 'Social Media Wizard' },
  { id: '2', name: 'Bob', role: 'Designer' },
  { id: '3', name: 'Charlie', role: 'Speaker' },
  { id: '4', name: 'David', role: 'Developer' },
  { id: '5', name: 'Eve', role: 'Project Manager' },
  { id: '6', name: 'Frank', role: 'Tester' },
  { id: '7', name: 'Grace', role: 'Marketing Expert' },
  { id: '8', name: 'Henry', role: 'Content Creator' },
];

const GuildBuilder: React.FC = () => {
  const { gameState, updateChallengeProgress, showToast } = useGameStore();
  const [guildState, setGuildState] = useState<GuildState | null>(null);
  const [selectedCompanions, setSelectedCompanions] = useState<GuildCompanion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Configuration validation
  if (!guildBuilderConfig) {
    return (
      <div className="p-4">
        <p className="title bg-card">Guild Builder — Errore</p>
        <div className="text-center text-red-600 mt-4">
          Configurazione della challenge "guild-builder" non trovata in <code>game-data.json</code>.
        </div>
      </div>
    );
  }

  const requiredRoles = guildBuilderConfig.requirements?.requirement?.roles || [];
  const questText = guildBuilderConfig.requirements?.requirement?.text || '';
  const TEAM_SIZE = 3; // Fixed team size

  useEffect(() => {
    if (gameState.currentUser.userId) {
      let state = gameStorage.getGuildState(gameState.currentUser.userId);
      
      if (!state) {
        // Initialize new guild state
        state = {
          id: `guild_${Date.now()}`,
          team: {},
          completed: false,
          attempts: 0,
          startedAt: new Date().toISOString(),
        };
        
        gameStorage.saveGuildState(gameState.currentUser.userId, state);
      }
      
      // Convert team object to selectedCompanions array, filtering out null/undefined values
      const teamArray = Object.values(state.team)
        .filter(companion => companion && companion.id && companion.name && companion.role) as GuildCompanion[];
      setSelectedCompanions(teamArray);
      setGuildState(state);
      setIsLoading(false);
    }
  }, [gameState.currentUser.userId]);

  const handleCompanionToggle = (companion: GuildCompanion) => {
    if (!guildState) return;

    const isSelected = selectedCompanions.some(c => c.id === companion.id);
    let newSelected: GuildCompanion[];

    if (isSelected) {
      // Remove companion
      newSelected = selectedCompanions.filter(c => c.id !== companion.id);
    } else {
      // Add companion (max 3)
      if (selectedCompanions.length >= TEAM_SIZE) {
        showToast(`Puoi selezionare al massimo ${TEAM_SIZE} compagni!`, 'error');
        return;
      }
      newSelected = [...selectedCompanions, companion];
    }

    setSelectedCompanions(newSelected);

    // Update guild state - only store actually selected companions, no empty slots
    const newTeam: Record<string, GuildCompanion> = {};
    newSelected.forEach((comp, index) => {
      newTeam[`slot_${index}`] = comp;
    });

    const updatedState: GuildState = {
      ...guildState,
      team: newTeam,
    };

    setGuildState(updatedState);
    gameStorage.saveGuildState(gameState.currentUser.userId, updatedState);
  };

  const handleSubmit = () => {
    if (!guildState) return;

    if (selectedCompanions.length !== TEAM_SIZE) {
      showToast(`Devi selezionare esattamente ${TEAM_SIZE} compagni!`, 'error');
      return;
    }

    // Check if the selected team has the required roles
    const selectedRoles = selectedCompanions.map(c => c.role);
    const hasAllRequiredRoles = requiredRoles.every((role: string) => selectedRoles.includes(role));

    const newAttempts = guildState.attempts + 1;
    
    if (hasAllRequiredRoles) {
      const updatedState: GuildState = {
        ...guildState,
        completed: true,
        attempts: newAttempts,
        finishedAt: new Date().toISOString(),
        score: 100,
      };

      setGuildState(updatedState);
      gameStorage.saveGuildState(gameState.currentUser.userId, updatedState);
      updateChallengeProgress('guild-builder', 1, true);
      showToast('Squadra perfetta! Challenge completata!', 'success');
    } else {
      const updatedState: GuildState = {
        ...guildState,
        attempts: newAttempts,
      };

      setGuildState(updatedState);
      gameStorage.saveGuildState(gameState.currentUser.userId, updatedState);
      showToast('La squadra non soddisfa i requisiti della quest. Riprova!', 'error');
    }
  };
  
  const handleRestart = () => {
    if (!gameState.currentUser.userId) return;
    
    const newState: GuildState = {
      id: `guild_${Date.now()}`,
      team: {},
      completed: false,
      attempts: 0,
      startedAt: new Date().toISOString(),
    };
    
    setGuildState(newState);
    setSelectedCompanions([]);
    gameStorage.saveGuildState(gameState.currentUser.userId, newState);
    showToast('Squadra ricominciata!', 'info');
  };

  if (isLoading || !guildState) {
    return (
      <div className="p-4">
        <p className="title bg-card">Guild Builder</p>
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  const isCompleted = guildState.completed;

  return (
    <ChallengeContentLayout
      gemTitle="La Gemma dell'Alleanza"
      gemIcon={allianceGem}
      description={guildBuilderConfig.description}
      tip={`Seleziona ${TEAM_SIZE} compagni che possano affrontare insieme la quest. Scegli con saggezza!`}
      progress={selectedCompanions.length}
      total={TEAM_SIZE}
      progressLabel="Squadra"
      isCompleted={isCompleted}
      completionMessage="Hai formato la squadra perfetta! La Gemma dell'Alleanza è tua."
    >
      <div className="p-4">
        {!isCompleted ? (
          <>
            {/* Quest display */}
            <div className="nes-container is-rounded mb-4">
              <p className="font-retro text-sm mb-2">📜 Quest:</p>
              <p className="text-sm">{questText}</p>
            </div>

            {/* Selected team display */}
            <div className="mb-6">
              <h4 className="font-retro text-xs mb-3">🛡️ La tua squadra ({selectedCompanions.length}/{TEAM_SIZE})</h4>
              <div className="grid grid-cols-1 gap-2">
                {Array.from({ length: TEAM_SIZE }, (_, index) => {
                  const companion = selectedCompanions[index];
                  return (
                    <div
                      key={index}
                      className={`nes-container is-rounded p-3 text-center ${
                        companion ? 'bg-green-100' : 'bg-gray-100'
                      }`}
                    >
                      {companion ? (
                        <div>
                          <div className="font-bold">{companion.name}</div>
                          <div className="text-xs text-gray-600">{companion.role}</div>
                        </div>
                      ) : (
                        <div className="text-gray-400">Slot vuoto</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Available companions */}
            <div className="mb-6">
              <h4 className="font-retro text-xs mb-3">👥 Compagni disponibili</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {companions.map((companion) => {
                  const isSelected = selectedCompanions.some(c => c.id === companion.id);
                  
                  return (
                    <button
                      key={companion.id}
                      className={`w-full p-3 border-2 border-black text-left text-sm transition-colors ${
                        isSelected 
                          ? 'bg-blue-200 text-blue-800' 
                          : 'bg-muted hover:bg-primary hover:text-white'
                      }`}
                      onClick={() => handleCompanionToggle(companion)}
                      data-testid={`companion-${companion.name.toLowerCase()}`}
                    >
                      <div className="font-bold">{companion.name}</div>
                      <div className="text-xs">{companion.role}</div>
                      {isSelected && <div className="text-xs">✓ Selezionato</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="text-center space-x-4">
              <button 
                className="nes-btn is-primary"
                onClick={handleSubmit}
                disabled={selectedCompanions.length !== TEAM_SIZE}
                data-testid="button-submit-team"
              >
                Conferma Squadra
              </button>
              <button 
                className="nes-btn is-warning"
                onClick={handleRestart}
                data-testid="button-restart-guild"
              >
                Ricomincia
              </button>
            </div>
          </>
        ) : (
          <ChallengeCompleted
            title="Gemma dell'Alleanza Conquistata!"
            message="Hai formato la squadra giusta per affrontare la sfida: la Gemma dell'Alleanza è tua. Il tuo gruppo ha dimostrato sinergia e solidarietà."
            emoji="🛡️"
          >
            <div className="nes-container is-light p-3 mb-3">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span>Squadra formata:</span>
                  <span className="font-retro">{selectedCompanions.length}/{TEAM_SIZE}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tentativi totali:</span>
                  <span>{guildState.attempts}</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button 
                className="nes-btn is-warning"
                onClick={handleRestart}
                data-testid="button-play-again"
              >
                Forma un'altra squadra
              </button>
            </div>
          </ChallengeCompleted>
        )}
      </div>
    </ChallengeContentLayout>
  );
};

export default GuildBuilder;
