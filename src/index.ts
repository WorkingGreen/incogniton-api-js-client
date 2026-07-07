/**
 * @module incogniton-js-client
 */

// Default Export: IncognitonClient
import { IncognitonClient } from './api/incogniton.client.js';
export default IncognitonClient;

// Named Export for Client
export { IncognitonClient } from './api/incogniton.client.js';
export type { IncognitonClientOptions, CloneProfileOptions } from './api/incogniton.client.js';

// Export Common Types (single source of truth for the wire shapes)
export type {
  ProfileId,
  ProfileStatus,
  Timestamps,
  BaseResponse,
  ApiResponse,
  ApiError,
  GeneralProfileInformation,
  Proxy,
  Timezone,
  WebRTC,
  Navigator,
  Other,
  BrowserProfile,
  BrowserTab,
  CreateBrowserProfileRequest,
  UpdateBrowserProfileRequest,
  Cookie,
  GetCookieResponse,
  AddCookieRequest,
  PuppeteerLaunchResponse,
  SeleniumLaunchResponse,
} from './models/common.types.js';

// Export the browser-automation config type
export type { BrowserConfig } from './models/api.types.js';

// Export HTTP Utilities
export { HttpAgent, HttpAgentBuilder, HttpMethod } from './utils/http/agent.js';
export { InitHttpAgent } from './utils/http/provider.js';
export { APIError, HttpError, TimeoutError } from './utils/http/errors.js';

// Export Browser Package
export { IncognitonBrowser } from './browser/incogniton.browser.js';
