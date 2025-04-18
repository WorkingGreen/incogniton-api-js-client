import { defaults } from '../config/defaults';
import { ProfileStatus } from '../models/browser-profile.types';
import {
  BrowserProfile,
  CreateBrowserProfileRequest,
  UpdateBrowserProfileRequest,
  GetCookieResponse,
  AddCookieRequest,
  ProfileId,
  Proxy,
} from '../models/common.types';
import { HttpAgentBuilder } from '../utils/http/agent';
import { InitHttpAgent } from '../utils/http/provider';

export class IncognitonClient {
  private readonly httpAgent: HttpAgentBuilder;
  private readonly timeout: number;

  constructor(baseUrl?: string) {
    this.httpAgent = InitHttpAgent('incogniton-client', baseUrl || defaults.baseUrl);
    this.timeout = defaults.timeout / 1000; // Convert milliseconds to seconds
  }

  /**
   * Profile-related operations
   */
  profile = {
    /**
     * Retrieves a list of all browser profiles from the Incogniton server.
     * @route GET /profile/all
     * @returns Promise<{ profiles: BrowserProfile[]; status: 'ok' }> - List of browser profiles
     */
    list: async (): Promise<{ profiles: BrowserProfile[]; status: 'ok' }> => {
      return this.httpAgent.get('/profile/all').set('Content-Type', 'application/json').do();
    },

    /**
     * Retrieves a specific browser profile by its ID.
     * @route GET /profile/get/{profile_id}
     * @param {ProfileId} id - Unique identifier of the profile
     * @returns Promise<{ profileData: BrowserProfile; status: 'ok' }> - Profile details
     */
    get: async (id: ProfileId): Promise<{ profileData: BrowserProfile; status: 'ok' }> => {
      return this.httpAgent.get(`/profile/get/${id}`).set('Content-Type', 'application/json').do();
    },

    /**
     * Adds a new browser profile with the specified configuration.
     * @route POST /profile/add
     * @param {CreateBrowserProfileRequest} data - Profile configuration data
     * @returns Promise<{ profile_browser_id: string; status: 'ok' }> - Created profile details
     */
    add: async (
      profileData: CreateBrowserProfileRequest
    ): Promise<{ profile_browser_id: string; status: 'ok' }> => {
      return this.httpAgent.post('/profile/add').setBody(profileData).toFormUrlEncoded().do();
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
      return this.httpAgent
        .post('/profile/update')
        .set('Content-Type', 'application/json')
        .setBody({ ...data, profile_browser_id: id })
        .do();
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
        .do();
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
        .do();
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
        .do();
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
        .do();
    },

    /**
     * Stops a running browser profile.
     * @route GET /profile/stop/{profile_id}
     * @param {ProfileId} id - Unique identifier of the profile to stop
     * @returns Promise<{ message: string; status: 'ok' }> - Stop confirmation
     */
    stop: async (id: ProfileId): Promise<{ message: string; status: 'ok' }> => {
      return this.httpAgent.get(`/profile/stop/${id}`).set('Content-Type', 'application/json').do();
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
        .do();
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
     * @returns Promise<{ CookieData: GetCookieResponse[]; message: string; status: 'ok' }> - List of cookies
     */
    get: async (
      profileId: ProfileId
    ): Promise<{ CookieData: GetCookieResponse[]; message: string; status: 'ok' }> => {
      return this.httpAgent
        .get(`/profile/cookie/${profileId}`)
        .set('Content-Type', 'application/json')
        .do();
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
      data: AddCookieRequest
    ): Promise<{ profile_browser_id: string; format: string; cookie: string }> => {
      return this.httpAgent
        .post('/profile/addCookie')
        .set('Content-Type', 'application/json')
        .setBody({ ...data, profile_browser_id: profileId })
        .do();
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
        .do();
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
        .do();
    },

    /**
     * Launches a browser profile with Puppeteer automation using custom arguments.
     * @route POST /automation/launch/puppeteer
     * @param {ProfileId} profileId - Unique identifier of the profile
     * @param {string} customArgs - Custom command-line arguments for launching the browser
     * @returns Promise<{ puppeteerUrl: string; status: 'ok' }> - Puppeteer connection URL
     */
    launchPuppeteerCustom: async (
      profileId: ProfileId,
      customArgs: string
    ): Promise<{ puppeteerUrl: string; status: 'ok' }> => {
      return this.httpAgent
        .post('/automation/launch/puppeteer')
        .set('Content-Type', 'application/json')
        .setBody({ profileID: profileId, customArgs })
        .do();
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
        .do();
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
        .do();
    },
  };
}
