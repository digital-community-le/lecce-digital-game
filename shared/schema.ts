import { z } from "zod";

// User Profile Schema
export const userProfileSchema = z.object({
  userId: z.string(),
  displayName: z.string().min(1).max(30),
  avatar: z.string(),
  createdAt: z.string(),
  lastUpdated: z.string(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// QR Data Schema
export const qrDataSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().optional(),
  timestamp: z.string(),
});

export type QRData = z.infer<typeof qrDataSchema>;

// User Scan Schema (Networking Forest)
export const userScanSchema = z.object({
  opId: z.string(),
  scannedUserId: z.string(),
  scannedName: z.string().optional(),
  scannedAvatarUrl: z.string().optional(),
  scannedAt: z.string(),
  source: z.literal('qr'),
  verified: z.boolean().optional(),
});

export type UserScan = z.infer<typeof userScanSchema>;

// Networking Progress Schema
export const networkingProgressSchema = z.object({
  userId: z.string(),
  scannedUserIds: z.array(z.string()),
  scannedCount: z.number(),
  completed: z.boolean(),
  lastUpdated: z.string(),
  version: z.number(),
});

export type NetworkingProgress = z.infer<typeof networkingProgressSchema>;

// Puzzle State Schema (Retro Puzzle)
export const puzzlePairSchema = z.object({
  id: z.string(),
  term: z.string(),
  category: z.string(),
});

export const puzzleStateSchema = z.object({
  id: z.string(),
  pairs: z.array(puzzlePairSchema),
  shuffledTerms: z.array(z.string()),
  shuffledCategories: z.array(z.string()),
  matches: z.record(z.string(), z.string()),
  remaining: z.number(),
  attempts: z.number(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  score: z.number().optional(),
});

export type PuzzlePair = z.infer<typeof puzzlePairSchema>;
export type PuzzleState = z.infer<typeof puzzleStateSchema>;

// Quiz State Schema (Debug Dungeon)
export const quizQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
  explanation: z.string().optional(),
  category: z.string().optional(),
});

export const quizStateSchema = z.object({
  id: z.string(),
  questions: z.array(quizQuestionSchema),
  currentQuestionIndex: z.number(),
  answers: z.array(z.number()),
  score: z.number(),
  completed: z.boolean(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizState = z.infer<typeof quizStateSchema>;

// Guild Builder State Schema
export const guildCompanionSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
});

export const guildStateSchema = z.object({
  id: z.string(),
  team: z.record(z.string(), guildCompanionSchema),
  completed: z.boolean(),
  attempts: z.number(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  score: z.number().optional(),
});

export type GuildCompanion = z.infer<typeof guildCompanionSchema>;
export type GuildState = z.infer<typeof guildStateSchema>;

// Social Proof Schema (Social Arena)
export const socialProofSchema = z.object({
  opId: z.string(),
  userId: z.string(),
  imageLocalUrl: z.string(),
  detectedTags: z.array(z.string()),
  detected: z.boolean(),
  verified: z.boolean(),
  attempts: z.number(),
  createdAt: z.string(),
});

export type SocialProof = z.infer<typeof socialProofSchema>;

// Challenge Configuration Schema
export const challengeConfigSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['networking', 'puzzle', 'quiz', 'social']),
  description: z.string(),
  requirements: z.object({
    type: z.string(),
    minDistinctScans: z.number().optional(),
    pairsCount: z.number().optional(),
    questionsCount: z.number().optional(),
    requiredTag: z.string().optional(),
  }),
  settings: z.record(z.string(), z.any()).optional(),
});

export type ChallengeConfig = z.infer<typeof challengeConfigSchema>;

// Game Progress Schema
export const gameProgressSchema = z.object({
  userId: z.string(),
  currentChallengeIndex: z.number(),
  completedChallenges: z.array(z.string()),
  totalScore: z.number(),
  startedAt: z.string(),
  lastUpdated: z.string(),
  gameCompleted: z.boolean(),
});

export type GameProgress = z.infer<typeof gameProgressSchema>;
