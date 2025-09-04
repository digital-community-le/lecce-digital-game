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
  { id: '1', name: 'Alice', role: 'Social Media Wizard', description: 'Esperta nel connettere persone e comunità online', avatar: '@assets/generated_images/Female_developer_avatar_pixel_20b982fb.png' },
  { id: '2', name: 'Bob', role: 'Designer', description: 'Crea esperienze visive memorabili e innovative', avatar: '@assets/generated_images/Designer_avatar_pixel_art_50737636.png' },
  { id: '3', name: 'Charlie', role: 'Speaker', description: 'Comunica idee complesse con chiarezza e passione', avatar: '@assets/generated_images/Teacher_avatar_pixel_art_c32e4d73.png' },
  { id: '4', name: 'David', role: 'Developer', description: 'Costruisce soluzioni tecniche robuste e scalabili', avatar: '@assets/generated_images/Developer_avatar_pixel_art_a2515cc8.png' },
  { id: '5', name: 'Eve', role: 'Project Manager', description: 'Coordina team e progetti con efficienza strategica', avatar: '@assets/generated_images/Manager_avatar_pixel_art_1555a05c.png' },
  { id: '6', name: 'Frank', role: 'Tester', description: 'Garantisce qualità e affidabilità in ogni dettaglio', avatar: '@assets/generated_images/Scientist_avatar_pixel_art_eac1695c.png' },
  { id: '7', name: 'Grace', role: 'Marketing Expert', description: 'Trasforma prodotti in storie che coinvolgono', avatar: '@assets/generated_images/Female_teacher_avatar_pixel_2ede18a1.png' },
  { id: '8', name: 'Henry', role: 'Content Creator', description: 'Produce contenuti che educano e ispirano', avatar: '@assets/generated_images/Student_avatar_pixel_art_285fb9d0.png' },
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
              <h4 className="font-retro text-sm mb-4" style={{ color: 'var(--ldc-contrast-yellow)' }}>🛡️ La tua squadra ({selectedCompanions.length}/{TEAM_SIZE})</h4>
              <div className="grid grid-cols-1 gap-3">
                {Array.from({ length: TEAM_SIZE }, (_, index) => {
                  const companion = selectedCompanions[index];
                  return (
                    <div
                      key={index}
                      className={`nes-container is-rounded p-4 flex items-center gap-4 ${
                        companion ? 'is-success' : 'is-light'
                      }`}
                      style={{ minHeight: '80px' }}
                    >
                      {companion ? (
                        <>
                          <div className="w-16 h-16 flex-shrink-0">
                            <img 
                              src={companion.avatar} 
                              alt={companion.name} 
                              className="w-full h-full object-contain"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-retro text-base mb-1" style={{ color: 'var(--ldc-rpg-green)' }}>{companion.name}</div>
                            <div className="text-sm font-medium mb-1">{companion.role}</div>
                            <div className="text-xs text-muted-foreground">{companion.description}</div>
                          </div>
                          <div className="text-2xl">✓</div>
                        </>
                      ) : (
                        <div className="w-full text-center py-4">
                          <div className="text-4xl mb-2">👤</div>
                          <div className="text-sm text-muted-foreground font-retro">Slot Libero</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Available companions */}
            <div className="mb-6">
              <h4 className="font-retro text-sm mb-4" style={{ color: 'var(--ldc-contrast-yellow)' }}>👥 Compagni Disponibili</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {companions.map((companion) => {
                  const isSelected = selectedCompanions.some(c => c.id === companion.id);
                  
                  return (
                    <button
                      key={companion.id}
                      className={`nes-container w-full p-4 text-left transition-all duration-200 transform hover:scale-105 ${
                        isSelected 
                          ? 'is-success' 
                          : 'hover:shadow-lg'
                      }`}
                      style={{
                        border: isSelected 
                          ? '4px solid var(--ldc-rpg-green)' 
                          : '4px solid var(--ldc-surface)',
                        backgroundColor: isSelected 
                          ? 'rgba(47, 140, 47, 0.1)' 
                          : 'var(--ldc-surface)',
                        boxShadow: isSelected 
                          ? '0 0 15px rgba(47, 140, 47, 0.5), inset 0 0 10px rgba(47, 140, 47, 0.2)' 
                          : '0 4px 8px rgba(0,0,0,0.1)'
                      }}
                      onClick={() => handleCompanionToggle(companion)}
                      data-testid={`companion-${companion.name.toLowerCase()}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 flex-shrink-0">
                          <img 
                            src={companion.avatar} 
                            alt={companion.name} 
                            className="w-full h-full object-contain"
                            style={{ 
                              imageRendering: 'pixelated',
                              filter: isSelected ? 'brightness(1.1) contrast(1.1)' : 'none'
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-retro text-base mb-1 ${
                            isSelected ? 'text-white' : ''
                          }`} style={{ 
                            color: isSelected ? 'var(--ldc-rpg-green)' : 'var(--ldc-on-surface)' 
                          }}>
                            {companion.name}
                          </div>
                          <div className={`text-sm font-medium mb-2 ${
                            isSelected ? 'text-white' : 'text-muted-foreground'
                          }`}>
                            {companion.role}
                          </div>
                          <div className={`text-xs leading-relaxed ${
                            isSelected ? 'text-gray-100' : 'text-muted-foreground'
                          }`}>
                            {companion.description}
                          </div>
                          {isSelected && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-lg">✓</span>
                              <span className="font-retro text-xs" style={{ color: 'var(--ldc-rpg-green)' }}>SELEZIONATO</span>
                            </div>
                          )}
                        </div>
                      </div>
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
