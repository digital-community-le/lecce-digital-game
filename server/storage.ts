import { type UserProfile } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<UserProfile | undefined>;
  getUserByUsername(username: string): Promise<UserProfile | undefined>;
  createUser(user: Partial<UserProfile>): Promise<UserProfile>;
}

export class MemStorage implements IStorage {
  private users: Map<string, UserProfile>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<UserProfile | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<UserProfile | undefined> {
    // UserProfile doesn't have username in shared schema; fallback to displayName
    return Array.from(this.users.values()).find(
      (user) => user.displayName === username,
    );
  }

  async createUser(insertUser: Partial<UserProfile>): Promise<UserProfile> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const user: UserProfile = {
      userId: id,
      displayName: insertUser.displayName || 'User',
      avatar: insertUser.avatar || '',
      createdAt: now,
      lastUpdated: now,
    };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
