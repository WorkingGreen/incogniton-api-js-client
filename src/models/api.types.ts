/**
 * @module models/api
 */

import type { BaseResponse } from './common.types';

/**
 * Generic API response type
 */
export interface ApiResponse<T> extends BaseResponse {
  data: T;
}

/**
 * API error response type
 */
export interface ApiError extends BaseResponse {
  error: string;
}

/**
 * Request type for creating a new browser profile.
 * Only general_profile_information is required, all other fields are optional.
 */
export interface CreateBrowserProfileRequest {
  /** General profile information including name, notes, and browser settings */
  general_profile_information: {
    /** Name of the browser profile */
    profile_name: string;
    /** Optional notes about the profile */
    profile_notes: string;
    /** Group the profile belongs to */
    profile_group: string;
    /** Last time the profile was edited */
    profile_last_edited: string;
    /** Operating system to simulate */
    simulated_operating_system: string;
    /** Version of the browser to simulate */
    profile_browser_version: string;
    /** Unique identifier for the browser */
    browser_id?: string;
  };

  /** Optional proxy configuration */
  Proxy?: {
    /** Type of proxy connection */
    connection_type: string;
    /** Proxy server URL */
    proxy_url: string;
    /** Proxy username if authentication is required */
    proxy_username?: string;
    /** Proxy password if authentication is required */
    proxy_password?: string;
    /** Whether proxy rotation is enabled */
    proxy_rotating?: number;
    /** Name of the proxy provider */
    proxy_provider?: string;
  };

  /** Optional timezone configuration */
  Timezone?: {
    /** Whether to automatically detect timezone based on IP */
    fill_timezone_based_on_ip: boolean;
    /** Manual timezone offset (e.g., "+01:00") */
    timezone_offset?: string;
    /** Name of the timezone (e.g., "Europe/Berlin") */
    timezone_name?: string;
  };

  /** Optional WebRTC configuration */
  WebRTC?: {
    /** Local IP address to use */
    local_ip?: string;
    /** Public IP address to use */
    public_ip?: string;
    /** WebRTC behavior mode */
    behavior: 'Altered' | 'Masked' | 'Real';
    /** Whether to set an external IP */
    set_external_ip: boolean;
  };

  /** Optional navigator configuration */
  Navigator?: {
    /** User agent string */
    user_agent: string;
    /** Screen resolution */
    screen_resolution: string;
    /** Whether to match Chrome core version */
    navigator_useragent_match_chrome_core?: boolean;
    /** Comma-separated list of language codes */
    languages?: string;
    /** Whether to toggle language based on IP */
    navigator_languageIPToggle?: number;
    /** Platform string */
    platform?: string;
    /** Whether to enable Do Not Track */
    do_not_track?: boolean;
    /** Number of logical processor cores */
    hardware_concurrency?: number;
    /** Whether to always use latest user agent */
    navigator_useragent_always_latest?: boolean;
  };

  /** Optional additional configuration */
  Other?: {
    /** Whether to allow real media devices */
    browser_allowRealMediaDevices: boolean;
    /** Whether to lock the active session */
    active_session_lock: boolean;
    /** Whether to show the profile name */
    other_ShowProfileName: boolean;
    /** Whether custom browser arguments are enabled */
    custom_browser_args_enabled: boolean;
    /** Whether to lock the browser language */
    browser_language_lock: boolean;
    /** Custom browser language code */
    custom_browser_language?: string;
    /** Custom browser arguments string */
    custom_browser_args_string?: string;
  };
}

/**
 * Request type for updating an existing browser profile.
 * All fields are optional.
 */
export interface UpdateBrowserProfileRequest extends Partial<CreateBrowserProfileRequest> {}

/**
 * Response type for getting a cookie
 */
export interface GetCookieResponse extends BaseResponse {
  data: {
    id: string;
    name: string;
    value: string;
    domain: string;
    path: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite: string;
    expires: number;
  };
}

/**
 * Request type for adding a cookie
 */
export interface AddCookieRequest {
  name: string;
  value: string;
  domain: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
  expires?: number;
}

/**
 * Response type returned when launching a Puppeteer automation session.
 */
export interface PuppeteerLaunchResponse extends BaseResponse {
  data: {
    puppeteerUrl: string;
    status: 'ok' | 'error';
  };
}

/**
 * Response type returned when launching a Selenium automation session.
 */
export interface SeleniumLaunchResponse extends BaseResponse {
  data: {
    status: 'ok' | 'error';
  };
}
