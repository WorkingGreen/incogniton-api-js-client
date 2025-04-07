/**
 * Main entry point for the Incogniton package
 */

// API Client
export { IncognitonClient } from './api/incogniton.client';

// Browser Automation Client
export { IncognitonBrowser, BrowserConfig } from './browser/incogniton.browser';

// Types
export * from './models/common.types';

// Export common types
export type {
  ProfileId,
  Timestamps,
  BaseResponse,
  GeneralProfileInformation,
  Proxy,
  Timezone,
  WebRTC,
  Navigator,
  Other,
} from './models/common.types';

// Export API types
export type {
  ApiResponse,
  ApiError,
  CreateBrowserProfileRequest,
  UpdateBrowserProfileRequest,
  GetCookieResponse,
  AddCookieRequest,
  PuppeteerLaunchResponse,
  SeleniumLaunchResponse,
} from './models/api.types';

// Export HTTP utilities
export { HttpAgent, HttpAgentBuilder, HttpMethod } from './utils/http/agent';
export { InitHttpAgent } from './utils/http/provider';
export { APIError, HttpError, TimeoutError } from './utils/http/errors';
