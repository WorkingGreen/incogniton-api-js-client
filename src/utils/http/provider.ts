import { HttpAgentBuilder } from './agent.js';

export function InitHttpAgent(serviceName: string, baseUrl?: string): HttpAgentBuilder {
  // The Incogniton automation API is served locally by the desktop app.
  const apiUrl = baseUrl || process.env.INCOGNITON_API_URL || 'http://localhost:35000';
  return new HttpAgentBuilder(apiUrl, serviceName);
}
