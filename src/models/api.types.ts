/**
 * @module models/api
 *
 * Backwards-compatible re-export surface. The canonical request/response types
 * live in `common.types.ts` (the shapes the client actually sends and receives);
 * this module re-exports them so existing `models/api.types` import paths keep
 * working, and adds the browser-automation config type.
 */

export type {
  ApiResponse,
  ApiError,
  BaseResponse,
  CreateBrowserProfileRequest,
  UpdateBrowserProfileRequest,
  GetCookieResponse,
  AddCookieRequest,
  Cookie,
  ProfileStatus,
  PuppeteerLaunchResponse,
  SeleniumLaunchResponse,
} from './common.types.js';

/**
 * Configuration for {@link IncognitonBrowser}.
 */
export interface BrowserConfig {
  /** The profile ID to use for the browser instance */
  profileId?: string;
  /** Whether to launch in headless mode */
  headless?: boolean;
  /** Custom command-line arguments for the browser */
  customArgs?: string;
  /** Port number for the Incogniton instance (default: 35000) */
  port?: number;
  /** Time to wait for browser launch in milliseconds (default: 35000) */
  launchTimeout?: number;
}
