import gameData from '@/assets/game-data.json';
import { IDevFestApiConfig } from '../interfaces/devfestApi.interfaces';

/**
 * Configuration provider for DevFest API
 * Single Responsibility: Provide configuration data
 * Interface Segregation: Only configuration-related methods
 */
export class DevFestApiConfigProvider {
  private readonly gameData: any;

  constructor(gameDataParam?: any) {
    this.gameData = gameDataParam || gameData;
  }

  getConfig(): IDevFestApiConfig {
    const config = this.gameData.gameConfig?.api;
    
    if (!config || !config.badgeEndpoint || !config.gameCompletionSecret) {
      throw new Error('DevFest API configuration is missing in game-data.json');
    }

    return {
      badgeEndpoint: config.badgeEndpoint,
      gameCompletionSecret: config.gameCompletionSecret
    };
  }

  validateConfig(): boolean {
    try {
      const config = this.getConfig();
      return !!(config.badgeEndpoint && config.gameCompletionSecret);
    } catch {
      return false;
    }
  }
}
