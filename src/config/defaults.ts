/**
 * Default configuration values for the Incogniton client
 */
export const defaults = {
  /**
   * Default base URL for the Incogniton API
   * @default http://localhost:35000
   */
  baseUrl: 'http://localhost:35000',

  /**
   * Default timeout for API requests in milliseconds
   * @default 60000
   */
  timeout: 60000,
} as const;
