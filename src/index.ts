/**
 * @module incogniton-js-client
 */

// Default Export: IncognitonClient
import { IncognitonClient } from './api/incogniton.client.js';
export default IncognitonClient;

// Named Export for Client
export { IncognitonClient } from './api/incogniton.client.js';

// Export Common Types
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
} from './models/common.types.js';

// Export API Types
export type {
  ApiResponse,
  ApiError,
  CreateBrowserProfileRequest,
  UpdateBrowserProfileRequest,
  GetCookieResponse,
  AddCookieRequest,
  PuppeteerLaunchResponse,
  SeleniumLaunchResponse,
} from './models/api.types.js';

// Export Browser Profile Types
export type { BrowserProfile } from './models/browser-profile.types.js';

// Export HTTP Utilities
export { HttpAgent, HttpAgentBuilder, HttpMethod } from './utils/http/agent.js';
export { InitHttpAgent } from './utils/http/provider.js';
export { APIError, HttpError, TimeoutError } from './utils/http/errors.js';

// Export Browser Package
export { IncognitonBrowser } from './browser/incogniton.browser.js';
