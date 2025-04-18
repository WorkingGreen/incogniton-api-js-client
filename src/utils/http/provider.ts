import { HttpAgentBuilder } from './agent.js';

export function InitHttpAgent(serviceName: string, baseUrl?: string): HttpAgentBuilder {
  const apiUrl = baseUrl || process.env.INCOGNITON_API_URL || 'https://api.incogniton.com/v1';
  return new HttpAgentBuilder(apiUrl, serviceName);
}
