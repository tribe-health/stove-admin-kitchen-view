import { AtpAgent } from '@atproto/api';



// Default AT Protocol service URL (e.g. Bluesky API)
export const DEFAULT_ATP_SERVICE_URL = 'https://bsky.social';

// Create a new agent
export let agent = new AtpAgent({ service: DEFAULT_ATP_SERVICE_URL });

/**
 * Update the agent with a new service URL if needed
 */
export function updateAgent(serviceUrl: string = DEFAULT_ATP_SERVICE_URL): void {
  if (serviceUrl !== agent.service.toString()) {
    agent = new AtpAgent({ service: serviceUrl });
  }
}
