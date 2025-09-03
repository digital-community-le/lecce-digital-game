/**
 * DEPRECATED: Use devfestApiServiceFactory.ts for new SOLID-compliant architecture
 * This file is kept for backward compatibility
 */

// Re-export from new factory to maintain compatibility
export { 
  handleGameCompletion,
  DevFestServiceFactory 
} from './devfestApiServiceFactory';

export type { 
  GameCompletionResult, 
  DevFestBadgeResponse 
} from './devfestApiServiceFactory';
