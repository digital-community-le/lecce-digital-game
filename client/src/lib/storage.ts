import { UserProfile, GameProgress, UserScan, PuzzleState, QuizState, SocialProof, GuildState } from '@shared/schema';

const STORAGE_KEYS = {
  PROFILE: (userId: string) => `ldc:profile:${userId}`,
  PROFILE_LAST: 'ldc:profile:last',
  QR: (userId: string) => `ldc:qr:${userId}`,
  PROGRESS: (userId: string) => `ldc:progress:${userId}`,
  SCANS: (userId: string) => `ldc:scans:${userId}`,
  PUZZLE_STATE: (userId: string) => `ldc:puzzle:${userId}`,
  GUILD_STATE: (userId: string) => `ldc:guild:${userId}`,
  QUIZ_STATE: (userId: string) => `ldc:quiz:${userId}`,
  SOCIAL: (userId: string) => `ldc:social:${userId}`,
  AUTH_TOKEN: (userId: string) => `ldc:auth:${userId}`,
  SYNC_QUEUE: 'ldc:sync-queue',
};

class GameStorage {
  // Profile methods
  saveProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE(profile.userId), JSON.stringify(profile));
    localStorage.setItem(STORAGE_KEYS.PROFILE_LAST, profile.userId);
  }

  getProfile(userId: string): UserProfile | null {
    const stored = localStorage.getItem(STORAGE_KEYS.PROFILE(userId));
    return stored ? JSON.parse(stored) : null;
  }

  getLastProfile(): UserProfile | null {
    const lastUserId = localStorage.getItem(STORAGE_KEYS.PROFILE_LAST);
    return lastUserId ? this.getProfile(lastUserId) : null;
  }

  // Auth token methods
  saveAuthToken(userId: string, token: string): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN(userId), token);
  }

  getAuthToken(userId: string): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN(userId));
  }

  // QR methods
  saveQR(userId: string, qrData: string): void {
    localStorage.setItem(STORAGE_KEYS.QR(userId), qrData);
  }

  getQR(userId: string): string | null {
    return localStorage.getItem(STORAGE_KEYS.QR(userId));
  }

  // Game progress methods
  saveProgress(progress: GameProgress): void {
    localStorage.setItem(STORAGE_KEYS.PROGRESS(progress.userId), JSON.stringify(progress));
  }

  getProgress(userId: string): GameProgress | null {
    const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS(userId));
    return stored ? JSON.parse(stored) : null;
  }

  // Networking Forest - Scans methods
  saveScans(userId: string, scans: UserScan[]): void {
    localStorage.setItem(STORAGE_KEYS.SCANS(userId), JSON.stringify(scans));
  }

  getScans(userId: string): UserScan[] {
    const stored = localStorage.getItem(STORAGE_KEYS.SCANS(userId));
    return stored ? JSON.parse(stored) : [];
  }

  addScan(userId: string, scan: UserScan): void {
    const scans = this.getScans(userId);
    scans.push(scan);
    this.saveScans(userId, scans);
  }

  // Retro Puzzle methods
  savePuzzleState(userId: string, state: PuzzleState): void {
    localStorage.setItem(STORAGE_KEYS.PUZZLE_STATE(userId), JSON.stringify(state));
  }

  getPuzzleState(userId: string): PuzzleState | null {
    const stored = localStorage.getItem(STORAGE_KEYS.PUZZLE_STATE(userId));
    return stored ? JSON.parse(stored) : null;
  }

  // Guild Builder methods
  saveGuildState(userId: string, state: GuildState): void {
    localStorage.setItem(STORAGE_KEYS.GUILD_STATE(userId), JSON.stringify(state));
  }

  getGuildState(userId: string): GuildState | null {
    const stored = localStorage.getItem(STORAGE_KEYS.GUILD_STATE(userId));
    return stored ? JSON.parse(stored) : null;
  }

  removeGuildState(userId: string): void {
    localStorage.removeItem(STORAGE_KEYS.GUILD_STATE(userId));
  }

  // Debug Dungeon methods
  saveQuizState(userId: string, state: QuizState): void {
    localStorage.setItem(STORAGE_KEYS.QUIZ_STATE(userId), JSON.stringify(state));
  }

  getQuizState(userId: string): QuizState | null {
    const stored = localStorage.getItem(STORAGE_KEYS.QUIZ_STATE(userId));
    return stored ? JSON.parse(stored) : null;
  }

  // Social Arena methods
  saveSocialProofs(userId: string, proofs: SocialProof[]): void {
    localStorage.setItem(STORAGE_KEYS.SOCIAL(userId), JSON.stringify(proofs));
  }

  getSocialProofs(userId: string): SocialProof[] {
    const stored = localStorage.getItem(STORAGE_KEYS.SOCIAL(userId));
    return stored ? JSON.parse(stored) : [];
  }

  addSocialProof(userId: string, proof: SocialProof): void {
    const proofs = this.getSocialProofs(userId);
    proofs.push(proof);
    this.saveSocialProofs(userId, proofs);
  }

  // Sync queue methods (for future remote backend support)
  getSyncQueue(): any[] {
    const stored = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return stored ? JSON.parse(stored) : [];
  }

  addToSyncQueue(operation: any): void {
    const queue = this.getSyncQueue();
    queue.push(operation);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  }

  clearSyncQueue(): void {
    localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
  }

  // Utility methods
  clear(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('ldc:')) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const gameStorage = new GameStorage();
