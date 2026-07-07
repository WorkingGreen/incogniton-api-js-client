import { defaults } from '../config/defaults.js';
import {
  BrowserProfile,
  BrowserTab,
  CreateBrowserProfileRequest,
  UpdateBrowserProfileRequest,
  GetCookieResponse,
  AddCookieRequest,
  ProfileId,
  ProfileStatus,
  Proxy,
} from '../models/common.types.js';
import { HttpAgentBuilder } from '../utils/http/agent.js';
import { InitHttpAgent } from '../utils/http/provider.js';

/**
 * Options accepted by the {@link IncognitonClient} constructor.
 */
export interface IncognitonClientOptions {
  /**
   * Base URL for the Incogniton API. Defaults to `http://localhost:35000`.
   * Can be overridden by the `INCOGNITON_API_URL` environment variable.
   */
  baseUrl?: string;
  /** Requests timeout in seconds. Defaults to 60 secs. */
  timeout?: number;
  /**
   * Port of the local Incogniton app. When set, `baseUrl` becomes
   * `http://localhost:<port>`. The API port is configurable in the
   * Incogniton app's Debug settings tab.
   */
  port?: number;
}

/**
 * Settings for cloning a profile via {@link IncognitonClient.profile.clone}.
 * Every field is optional; omitted clone flags fall back to the server
 * default (which is `true` for each).
 */
export interface CloneProfileOptions {
  /** Name for the clone. Defaults to the source profile's name. */
  profileName?: string;
  /** Group for the clone. Defaults to the source profile's group. */
  targetGroup?: string;
  /** Copy cookies (default true). */
  cloneCookies?: boolean;
  /** Copy advanced/other settings (default true). */
  cloneAdvancedOtherSettings?: boolean;
  /** Copy the user agent (default true). */
  cloneUseragent?: boolean;
  /** Copy other browser data (default true). */
  cloneOtherBrowserData?: boolean;
}

export class IncognitonClient {
  private readonly httpAgent: HttpAgentBuilder;
  private readonly timeout?: number;

  /**
   * Creates a new Incogniton API client instance
   * @param baseUrlOrOptions `optional` Either the base URL string for the
   * Incogniton API, or an {@link IncognitonClientOptions} object:
   * - If not provided, defaults to http://localhost:35000
   * - Can be overridden by `INCOGNITON_API_URL` environment variable
   * @param timeout `optional` Sets requests timeout in seconds. Defaults to 60 secs.
   * Ignored when an options object is passed (use `options.timeout` instead).
   *
   * @example
   * ```typescript
   * const client = new IncognitonClient();
   *
   * // Target a non-default app port (configurable in the Debug settings tab)
   * const client = new IncognitonClient({ port: 40000 });
   * ```
   *
   * @note For browser automation with Puppeteer integration, use the `{ IncognitonBrowser }` module
   * which provides a higher-level interface for managing browser instances.
   */
  constructor(baseUrlOrOptions?: string | IncognitonClientOptions, timeout?: number) {
    let baseUrl: string | undefined;
    let resolvedTimeout: number | undefined;
    let port: number | undefined;

    if (typeof baseUrlOrOptions === 'object' && baseUrlOrOptions !== null) {
      baseUrl = baseUrlOrOptions.baseUrl;
      resolvedTimeout = baseUrlOrOptions.timeout;
      port = baseUrlOrOptions.port;
    } else {
      baseUrl = baseUrlOrOptions;
      resolvedTimeout = timeout;
    }

    if (port !== undefined) {
      baseUrl = `http://localhost:${port}`;
    }

    this.httpAgent = InitHttpAgent('incogniton-client', baseUrl || defaults.baseUrl);
    this.timeout = resolvedTimeout;
  }

  /**
   * System-level operations
   */
  system = {
    /**
     * Health probe for the Incogniton app.
     * @route GET /alive
     * @returns Promise<string> - `'OK'` when the desktop app is reachable.
     *
     * @note `/alive` is the API's only non-JSON endpoint. Across app versions
     * it serves either the JSON-quoted string `"OK"` or a bare `OK`; both
     * (and any surrounding whitespace) are normalized to a plain `'OK'`.
     */
    alive: async (): Promise<string> => {
      const raw: string = await this.httpAgent.get('/alive').asText().do(this.timeout);
      return (raw ?? '').toString().trim().replace(/^"|"$/g, '');
    },

    /**
     * Shuts down the Incogniton application.
     * @route GET /incogniton/close
     * @returns Promise<{ message: string; status: 'ok' }> - Shutdown confirmation
     */
    close: async (): Promise<{ message: string; status: 'ok' }> => {
      return this.httpAgent
        .get('/incogniton/close')
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },
  };

  /**
   * Profile-related operations
   */
  profile = {
    /**
     * Retrieves a list of all browser profiles from the Incogniton server.
     * @route GET /profile/all/
     * @returns Promise<{ profileData: BrowserProfile[]; status: 'ok' }> - List of
     *   browser profiles, under the key `profileData` (the trailing slash on the
     *   path is part of the registered V5 route).
     */
    list: async (): Promise<{ profileData: BrowserProfile[]; status: 'ok' }> => {
  return this.httpAgent.get('/profile/all/').set('Content-Type', 'application/json').do(this.timeout);
    },

    /**
     * Retrieves a specific browser profile by its ID.
     * @route GET /profile/get/{profile_id}
     * @param {ProfileId} id - Unique identifier of the profile
     * @returns Promise<{ profileData: BrowserProfile; status: 'ok' }> - Profile details
     */
    get: async (id: ProfileId): Promise<{ profileData: BrowserProfile; status: 'ok' }> => {
  return this.httpAgent.get(`/profile/get/${id}`).set('Content-Type', 'application/json').do(this.timeout);
    },

    /**
     * Adds a new browser profile with the specified configuration.
     * @route POST /profile/add
     * @param {CreateBrowserProfileRequest} data - Profile configuration data
     * @returns Promise<{ profile_browser_id: string; status: 'ok' }> - Created profile details
     */
    add: async (
      addProfileEntry: CreateBrowserProfileRequest
    ): Promise<{ profile_browser_id: string; status: 'ok' }> => {
      // Convert the entire profileData object to a JSON string
      const jsonString = JSON.stringify(addProfileEntry.profileData);
      
      // Wrap it in the profileData parameter as expected by the API
      const formData = {
        profileData: jsonString
      }
      

      return this.httpAgent
        .post('/profile/add')
        .setBody(formData)
  .toFormUrlEncoded()
  .do(this.timeout);
    },

    /**
     * Updates an existing browser profile with new configuration.
     * @route POST /profile/update
     * @param {ProfileId} id - Unique identifier of the profile to update
     * @param {UpdateBrowserProfileRequest} data - Updated profile configuration
     * @returns Promise<{ message: string; status: 'ok' }> - Update confirmation
     */
    update: async (
      id: ProfileId,
      data: UpdateBrowserProfileRequest
    ): Promise<{ message: string; status: 'ok' }> => {
      // First, stringify the data exactly as needed by the API
      const jsonString = JSON.stringify({
        profile_browser_id: id,
        ...data.profileData
      });
      
      // Then wrap it in the profileData parameter as expected by the API
      const formData = {
        profileData: jsonString
      };

      return this.httpAgent
        .post('/profile/update')
        .setBody(formData)
        .toFormUrlEncoded()
        .do(this.timeout);
    },

    /**
     * @helper Helper method to update a browser profile's proxy configuration.
     * @param {ProfileId} id - The ID of the profile to update.
     * @param {Proxy} proxy - The new proxy configuration.
     * @returns Promise<{ message: string; status: 'ok' }> - Update confirmation.
     */
    switchProxy: async (
      id: ProfileId,
      proxy: Proxy
    ): Promise<{ message: string; status: 'ok' }> => {
      return this.profile.update(id, {
        profileData: { Proxy: proxy },
      });
    },

    /**
     * Launches a browser profile with default launch mode.
     * @route GET /profile/launch/{profile_id}
     * @param {ProfileId} id - Unique identifier of the profile to launch
     * @returns Promise<{ message: string; status: 'ok' }> - Launch confirmation
     */ 
    launch: async (id: ProfileId): Promise<{ message: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/profile/launch/${id}`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Forces a browser profile to launch in local mode.
     * @route GET /profile/launch/{profile_id}/force/local
     * @param {ProfileId} id - Unique identifier of the profile to launch locally
     * @returns Promise<{ message: string; status: 'ok' }> - Launch confirmation
     */
    launchForceLocal: async (id: ProfileId): Promise<{ message: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/profile/launch/${id}/force/local`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Retrieves the current status of a browser profile.
     * @route GET /profile/status/{profile_id}
     * @param {ProfileId} id - Unique identifier of the profile
     * @returns Promise<{ status: ProfileStatus }> - Profile status information
     */
    getStatus: async (id: ProfileId): Promise<{ status: ProfileStatus }> => {
      return this.httpAgent
        .get(`/profile/status/${id}`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Forces a browser profile to launch in cloud mode.
     * @route GET /profile/launch/{profile_id}/force/cloud
     * @param {ProfileId} id - Unique identifier of the profile to launch in cloud
     * @returns Promise<{ message: string; status: 'ok' }> - Launch confirmation
     */
    launchForceCloud: async (id: ProfileId): Promise<{ message: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/profile/launch/${id}/force/cloud`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Stops a running browser profile.
     * @route GET /profile/stop/{profile_id}
     * @param {ProfileId} id - Unique identifier of the profile to stop
     * @returns Promise<{ message: string; status: 'ok' }> - Stop confirmation
     */
    stop: async (id: ProfileId): Promise<{ message: string; status: 'ok' }> => {
  return this.httpAgent.get(`/profile/stop/${id}`).set('Content-Type', 'application/json').do(this.timeout);
    },

    /**
     * Force stop a running browser profile.
     * @route GET /profile/force-stop/{profile_id}
     * @param {ProfileId} id - Unique identifier of the profile to force stop
     * @returns Promise<{ message: string; status: 'ok' }> - Force stop confirmation
     */
    forceStop: async (id: ProfileId): Promise<{ message: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/profile/force-stop/${id}`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Deletes a browser profile by its ID.
     * @route GET /profile/delete/{profile_id}
     * @param {ProfileId} id - Unique identifier of the profile to delete
     * @returns Promise<{ message: string; status: 'ok' }> - Deletion confirmation
     */
    delete: async (id: ProfileId): Promise<{ message: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/profile/delete/${id}`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Clones a profile with custom settings.
     * @route POST /profile/clone
     * @param {ProfileId} id - Browser id of the source profile
     * @param {CloneProfileOptions} options - Optional clone settings. Omitted
     *   clone flags fall back to the server default (`true` for each).
     * @returns Promise<{ profile_browser_id: string; status: 'ok' }> - The new clone's id
     */
    clone: async (
      id: ProfileId,
      options: CloneProfileOptions = {}
    ): Promise<{ profile_browser_id: string; status: 'ok' }> => {
      const body: Record<string, string | boolean> = { profile_browser_id: id };
      if (options.profileName !== undefined) body.profile_name = options.profileName;
      if (options.targetGroup !== undefined) body.target_group = options.targetGroup;
      if (options.cloneCookies !== undefined) body.clone_cookies = options.cloneCookies;
      if (options.cloneAdvancedOtherSettings !== undefined)
        body.clone_advanced_other_settings = options.cloneAdvancedOtherSettings;
      if (options.cloneUseragent !== undefined) body.clone_useragent = options.cloneUseragent;
      if (options.cloneOtherBrowserData !== undefined)
        body.clone_other_browser_data = options.cloneOtherBrowserData;

      return this.httpAgent
        .post('/profile/clone')
        .set('Content-Type', 'application/json')
        .setBody(body)
        .do(this.timeout);
    },

    /**
     * Clones a profile using all-true defaults (same name/group, every clone option on).
     * @route GET /profile/clone/{profile_id}
     * @param {ProfileId} id - Browser id of the source profile
     * @returns Promise<{ profile_browser_id: string; status: 'ok' }> - The new clone's id
     */
    cloneQuick: async (
      id: ProfileId
    ): Promise<{ profile_browser_id: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/profile/clone/${id}`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Prepares a launch without starting the browser. Runs the prep stages and
     * returns the built launch command as `arg`.
     * @route GET /profile/dryLaunch/{profile_id}
     * @param {ProfileId} id - Unique identifier of the profile
     * @returns Promise<{ arg: string; status: 'ok' }> - The full launch command
     */
    dryLaunch: async (id: ProfileId): Promise<{ arg: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/profile/dryLaunch/${id}`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Dry-launches a profile, forcing the LOCAL copy when out of sync.
     * @route GET /profile/dryLaunch/{profile_id}/force/local
     * @param {ProfileId} id - Unique identifier of the profile
     * @returns Promise<{ arg: string; status: 'ok' }> - The full launch command
     */
    dryLaunchForceLocal: async (id: ProfileId): Promise<{ arg: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/profile/dryLaunch/${id}/force/local`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Dry-launches a profile, forcing the CLOUD copy when out of sync.
     * @route GET /profile/dryLaunch/{profile_id}/force/cloud
     * @param {ProfileId} id - Unique identifier of the profile
     * @returns Promise<{ arg: string; status: 'ok' }> - The full launch command
     */
    dryLaunchForceCloud: async (id: ProfileId): Promise<{ arg: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/profile/dryLaunch/${id}/force/cloud`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },
  };

  /**
   * Cookie-related operations
   */
  cookie = {
    /**
     * Retrieves all cookies associated with a browser profile.
     * @route GET /profile/cookie/{profile_id}
     * @param {ProfileId} profileId - Unique identifier of the profile
     * @returns Promise<GetCookieResponse> - List of cookies. Note the array is
     *   under the key `'CookieData '` (trailing space) — a preserved V4 wire quirk.
     */
    get: async (profileId: ProfileId): Promise<GetCookieResponse> => {
      return this.httpAgent
        .get(`/profile/cookie/${profileId}`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Adds a new cookie to a browser profile.
     * @route POST /profile/addCookie
     * @param {ProfileId} profileId - Unique identifier of the profile
     * @param {AddCookieRequest} data - Cookie data to add
     * @returns Promise<{ profile_browser_id: string; format: string; cookie: string }> - Added cookie details
     */
    add: async (
      profileId: ProfileId,
      cookieData: Array<{
        name: string;
        value: string;
        domain: string;
        path?: string;
        secure?: boolean;
        httpOnly?: boolean;
        sameSite?: string;
        expires?: number;
      }>
    ): Promise<{ profile_browser_id: string; format: string; cookie: string }> => {
      // Convert cookie data to base64
      const cookieString = Buffer.from(JSON.stringify(cookieData)).toString('base64');
      
      const requestData = {
        profile_browser_id: profileId,
        format: 'base64json' as const,
        cookie: cookieString
      };

      return this.httpAgent
  .post('/profile/addCookie')
  .set('Content-Type', 'application/json')
  .setBody(requestData)
  .do(this.timeout);
    },

    /**
     * Deletes all cookies from a browser profile.
     * @route GET /profile/deleteCookie/{profile_id}
     * @param {ProfileId} profileId - Unique identifier of the profile
     * @returns Promise<{ message: string; status: 'ok' }> - Deletion confirmation
     */
    delete: async (profileId: ProfileId): Promise<{ message: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/profile/deleteCookie/${profileId}`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },
  };

  /**
   * Live browser-control operations. Each acts on an already-running profile
   * (launch it first via {@link IncognitonClient.profile.launch}).
   */
  control = {
    /**
     * Opens a URL in a running profile's browser, reusing a blank/new tab when
     * one is free, otherwise opening a new tab.
     * @route POST /profile/openUrl/{profile_id}
     * @param {ProfileId} id - Unique identifier of the running profile
     * @param {string} url - The URL (or bare host, opened as https://) to open
     * @returns Promise<{ message: string; status: 'ok' }> - Confirmation
     */
    openUrl: async (
      id: ProfileId,
      url: string
    ): Promise<{ message: string; status: 'ok' }> => {
      return this.httpAgent
        .post(`/profile/openUrl/${id}`)
        .set('Content-Type', 'application/json')
        .setBody({ url })
        .do(this.timeout);
    },

    /**
     * Navigates the foreground tab to a URL in place (does not open a new tab).
     * @route POST /profile/navigate/{profile_id}
     * @param {ProfileId} id - Unique identifier of the running profile
     * @param {string} url - The URL (or bare host) to navigate to
     * @returns Promise<{ message: string; status: 'ok' }> - Confirmation
     */
    navigate: async (
      id: ProfileId,
      url: string
    ): Promise<{ message: string; status: 'ok' }> => {
      return this.httpAgent
        .post(`/profile/navigate/${id}`)
        .set('Content-Type', 'application/json')
        .setBody({ url })
        .do(this.timeout);
    },

    /**
     * Refreshes the foreground tab of a running profile's browser.
     * @route GET /profile/refresh/{profile_id}
     * @param {ProfileId} id - Unique identifier of the running profile
     * @returns Promise<{ message: string; status: 'ok' }> - Confirmation
     */
    refresh: async (id: ProfileId): Promise<{ message: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/profile/refresh/${id}`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Lists the open tabs of a running profile's browser.
     * @route GET /profile/tabs/{profile_id}
     * @param {ProfileId} id - Unique identifier of the running profile
     * @returns Promise<{ tabs: BrowserTab[]; status: 'ok' }> - The open tabs
     */
    tabs: async (id: ProfileId): Promise<{ tabs: BrowserTab[]; status: 'ok' }> => {
      return this.httpAgent
        .get(`/profile/tabs/${id}`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Brings a tab to the foreground.
     * @route POST /profile/activateTab/{profile_id}
     * @param {ProfileId} id - Unique identifier of the running profile
     * @param {string} targetId - The tab's targetId (from {@link IncognitonClient.control.tabs})
     * @returns Promise<{ message: string; status: 'ok' }> - Confirmation
     */
    activateTab: async (
      id: ProfileId,
      targetId: string
    ): Promise<{ message: string; status: 'ok' }> => {
      return this.httpAgent
        .post(`/profile/activateTab/${id}`)
        .set('Content-Type', 'application/json')
        .setBody({ targetId })
        .do(this.timeout);
    },

    /**
     * Closes a tab.
     * @route POST /profile/closeTab/{profile_id}
     * @param {ProfileId} id - Unique identifier of the running profile
     * @param {string} targetId - The tab's targetId (from {@link IncognitonClient.control.tabs})
     * @returns Promise<{ message: string; status: 'ok' }> - Confirmation
     */
    closeTab: async (
      id: ProfileId,
      targetId: string
    ): Promise<{ message: string; status: 'ok' }> => {
      return this.httpAgent
        .post(`/profile/closeTab/${id}`)
        .set('Content-Type', 'application/json')
        .setBody({ targetId })
        .do(this.timeout);
    },
  };

  /**
   * Automation-related operations
   */
  automation = {
    /**
     * Launches a browser profile with Puppeteer automation.
     * @route GET /automation/launch/puppeteer/{profile_id}
     * @param {ProfileId} profileId - Unique identifier of the profile
     * @returns Promise<{ puppeteerUrl: string; status: 'ok' }> - Puppeteer connection URL
     */
    launchPuppeteer: async (
      profileId: ProfileId
    ): Promise<{ puppeteerUrl: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/automation/launch/puppeteer/${profileId}`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Launches a browser profile with Puppeteer automation using custom arguments.
     * @route POST /automation/launch/puppeteer/
     * @param {ProfileId} profileId - Unique identifier of the profile
     * @param {string} customArgs - Custom command-line arguments for launching the browser
     * @returns Promise<{ puppeteerUrl: string; status: 'ok' }> - Puppeteer connection URL
     */
    launchPuppeteerCustom: async (
      profileId: ProfileId,
      customArgs: string
    ): Promise<{ puppeteerUrl: string; status: 'ok' }> => {
      return this.httpAgent
        .post('/automation/launch/puppeteer/')
        .set('Content-Type', 'application/json')
        .setBody({ profileID: profileId, customArgs })
        .do(this.timeout);
    },

    /**
     * Launches a browser profile with Selenium automation.
     * @route GET /automation/launch/python/{profile_id}
     * @param {ProfileId} profileId - Unique identifier of the profile
     * @returns Promise<{ status: 'ok' }> - Launch confirmation
     */
    launchSelenium: async (profileId: ProfileId): Promise<{ status: 'ok' }> => {
      return this.httpAgent
        .get(`/automation/launch/python/${profileId}`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Launches a browser profile with Selenium automation using custom arguments.
     * @route POST /automation/launch/python/{profile_id}/
     * @param {ProfileId} profileId - Unique identifier of the profile
     * @param {string} customArgs - Custom command-line arguments for launching the browser
     * @returns Promise<{ status: 'ok' }> - Launch confirmation
     */
    launchSeleniumCustom: async (
      profileId: ProfileId,
      customArgs: string
    ): Promise<{ status: 'ok' }> => {
      return this.httpAgent
        .post(`/automation/launch/python/${profileId}/`)
        .set('Content-Type', 'application/json')
        .setBody({ customArgs })
        .do(this.timeout);
    },

    /**
     * Launches a profile for Puppeteer, forcing the LOCAL copy when out of sync.
     * @route GET /automation/launch/puppeteer/{profile_id}/local
     * @param {ProfileId} profileId - Unique identifier of the profile
     * @returns Promise<{ puppeteerUrl: string; status: 'ok' }> - Puppeteer connection URL
     */
    launchPuppeteerForceLocal: async (
      profileId: ProfileId
    ): Promise<{ puppeteerUrl: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/automation/launch/puppeteer/${profileId}/local`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Launches a profile for Puppeteer, forcing the CLOUD copy when out of sync.
     * @route GET /automation/launch/puppeteer/{profile_id}/cloud
     * @param {ProfileId} profileId - Unique identifier of the profile
     * @returns Promise<{ puppeteerUrl: string; status: 'ok' }> - Puppeteer connection URL
     */
    launchPuppeteerForceCloud: async (
      profileId: ProfileId
    ): Promise<{ puppeteerUrl: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/automation/launch/puppeteer/${profileId}/cloud`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Launches a profile on the Selenium grid, forcing the LOCAL copy when out of sync.
     * @route GET /automation/launch/python/{profile_id}/local
     * @param {ProfileId} profileId - Unique identifier of the profile
     * @returns Promise<{ url: string; status: 'ok' }> - Grid URL
     */
    launchSeleniumForceLocal: async (
      profileId: ProfileId
    ): Promise<{ url: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/automation/launch/python/${profileId}/local`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Launches a profile on the Selenium grid, forcing the CLOUD copy when out of sync.
     * @route GET /automation/launch/python/{profile_id}/cloud
     * @param {ProfileId} profileId - Unique identifier of the profile
     * @returns Promise<{ url: string; status: 'ok' }> - Grid URL
     */
    launchSeleniumForceCloud: async (
      profileId: ProfileId
    ): Promise<{ url: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/automation/launch/python/${profileId}/cloud`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },

    /**
     * Launches a profile on the Selenium grid with custom args, sending the
     * profile id in the request body.
     * @route POST /automation/launch/python/
     * @param {ProfileId} profileId - Unique identifier of the profile
     * @param {object} [options] - Optional launch settings
     * @param {string} [options.customArgs] - Extra args passed to the launch
     * @param {boolean} [options.forceLocal] - Force the local copy when out of sync
     * @param {boolean} [options.forceCloud] - Force the cloud copy when out of sync
     * @returns Promise<{ url: string; status: 'ok' }> - Grid URL
     */
    launchSeleniumCustomBody: async (
      profileId: ProfileId,
      options: { customArgs?: string; forceLocal?: boolean; forceCloud?: boolean } = {}
    ): Promise<{ url: string; status: 'ok' }> => {
      const body: Record<string, string | boolean> = { profileID: profileId };
      if (options.customArgs !== undefined) body.customArgs = options.customArgs;
      if (options.forceLocal) body.forceLocal = true;
      if (options.forceCloud) body.forceCloud = true;

      return this.httpAgent
        .post('/automation/launch/python/')
        .set('Content-Type', 'application/json')
        .setBody(body)
        .do(this.timeout);
    },

    /**
     * Runs the cookie-collection robot on a profile. Forces the cloud copy and
     * uses default settings (top-50 sites, 120s timeout, accept-cookies
     * extension, random crawl order).
     * @route GET /automation/cookieRobot/{profile_id}
     * @param {ProfileId} profileId - Unique identifier of the profile
     * @returns Promise<{ message: string; status: 'ok' }> - Launch confirmation
     */
    launchCookieRobot: async (
      profileId: ProfileId
    ): Promise<{ message: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/automation/cookieRobot/${profileId}`)
        .set('Content-Type', 'application/json')
        .do(this.timeout);
    },
  };
}
