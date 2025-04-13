/** Unique identifier for a browser profile */
export type ProfileId = string;

/** Interface containing timestamp fields for creation and update times */
export interface Timestamps {
  /** ISO 8601 timestamp when the resource was created */
  createdAt: string;
  /** ISO 8601 timestamp when the resource was last updated */
  updatedAt: string;
}

/** Base response interface for all API responses */
export interface BaseResponse {
  /** HTTP status code of the response */
  status: number;
  /** Optional message describing the response */
  message?: string;
}

/** Generic API response type */
export interface ApiResponse<T> extends BaseResponse {
  data: T;
}

/** API error response type */
export interface ApiError extends BaseResponse {
  error: string;
}

/** General information about a browser profile */
export interface GeneralProfileInformation {
  /** Human-readable name for the profile */
  profile_name: string;
  /** Optional notes or comments about the profile's purpose */
  profile_notes: string;
  /** Category or group identifier for organizing profiles */
  profile_group: string;
  /** ISO 8601 timestamp of the last profile modification */
  profile_last_edited: string;
  /** Operating system to emulate (e.g., Windows, macOS, Linux) */
  simulated_operating_system: string;
  /** Browser version or engine version to simulate */
  profile_browser_version: string;
  /** Unique identifier for the browser */
  browser_id?: string;
}

/** Proxy configuration settings for a profile */
export interface Proxy {
  /** Type of proxy connection (e.g., HTTP, SOCKS5) */
  connection_type: string;
  /** URL or IP address with port of the proxy server */
  proxy_url: string;
  /** Username for proxy authentication */
  proxy_username?: string;
  /** Password for proxy authentication */
  proxy_password?: string;
  /** Proxy rotation settings (1 for enabled, 0 for disabled) */
  proxy_rotating?: number;
  /** Identifier or name of the proxy provider service */
  proxy_provider?: string;
}

/** Timezone configuration for a profile */
export interface Timezone {
  /** Whether to automatically detect timezone based on IP */
  fill_timezone_based_on_ip: boolean;
  /** Standard timezone name (e.g., America/New_York) */
  timezone_name?: string;
  /** Offset from UTC in minutes */
  timezone_offset?: string;
}

/** WebRTC configuration settings */
export interface WebRTC {
  /** Whether to set a custom external IP address */
  set_external_ip: boolean;
  /** WebRTC behavior mode */
  behavior: 'Altered' | 'Masked' | 'Real';
  /** Public IP address to advertise via WebRTC */
  public_ip?: string;
  /** Local IP address to use in WebRTC sessions */
  local_ip?: string;
}

/** Browser navigator settings for fingerprint consistency */
export interface Navigator {
  /** User-Agent string to report */
  user_agent: string;
  /** Screen resolution in WIDTHxHEIGHT format */
  screen_resolution: string;
  /** Whether to match User-Agent with Chrome core version */
  navigator_useragent_match_chrome_core?: boolean;
  /** Comma-separated list of language codes */
  languages?: string;
  /** Whether to toggle language based on IP */
  navigator_languageIPToggle?: number;
  /** Platform to report (e.g., Win32, MacIntel) */
  platform: string;
  /** Whether to enable Do Not Track setting */
  do_not_track?: boolean;
  /** Number of logical processor cores to simulate */
  hardware_concurrency?: number;
  /** Whether to always use latest User-Agent version */
  navigator_useragent_always_latest?: boolean;
}

/** Miscellaneous browser settings */
export interface Other {
  /** Whether to prevent changes during active session */
  active_session_lock: boolean;
  /** Whether to display profile name in UI */
  other_ShowProfileName: boolean;
  /** Whether to allow real media devices */
  browser_allowRealMediaDevices: boolean;
  /** Whether custom browser arguments are enabled */
  custom_browser_args_enabled: boolean;
  /** Custom browser arguments string */
  custom_browser_args_string?: string;
  /** Whether to lock the browser language */
  browser_language_lock: boolean;
  /** Custom browser language code */
  custom_browser_language?: string;
}

/**
 * Represents a complete browser profile with all its configuration options.
 * This interface matches the OpenAPI specification exactly.
 */
export interface BrowserProfile {
  /** General profile information including name, notes, and browser settings */
  general_profile_information: GeneralProfileInformation;

  /** Timezone configuration settings */
  Timezone?: Timezone;

  /** WebRTC configuration settings */
  WebRTC?: WebRTC;

  /** Navigator configuration settings */
  Navigator?: Navigator;

  /** Additional browser configuration options */
  Other?: Other;
}

/**
 * Request type for creating a new browser profile.
 * Only general_profile_information is required, all other fields are optional.
 */
export interface CreateBrowserProfileRequest {
  /** Profile configuration data containing all settings for the browser profile */
  profileData: {
    /** General profile information including name, notes, and browser settings */
    general_profile_information: GeneralProfileInformation;

    /** Optional proxy configuration */
    Proxy?: Proxy;

    /** Optional timezone configuration */
    Timezone?: Timezone;

    /** Optional WebRTC configuration */
    WebRTC?: WebRTC;

    /** Optional navigator configuration */
    Navigator?: Navigator;

    /** Optional additional configuration */
    Other?: Other;
  };
}

/**
 * Request type for updating an existing browser profile.
 * All fields are optional.
 */
/**
 * Request type for updating an existing browser profile.
 * Allows partial updates of profile settings where only changed fields need to be provided.
 */
export interface UpdateBrowserProfileRequest {
  /** Optional profile configuration data containing settings to update */
  profileData?: {
    /** Optional general profile information updates */
    general_profile_information?: Partial<GeneralProfileInformation>;

    /** Optional proxy configuration updates */
    Proxy?: Partial<Proxy>;

    /** Optional timezone configuration updates */
    Timezone?: Partial<Timezone>;

    /** Optional WebRTC configuration updates */
    WebRTC?: Partial<WebRTC>;

    /** Optional navigator configuration updates */
    Navigator?: Partial<Navigator>;

    /** Optional additional configuration updates */
    Other?: Partial<Other>;
  };
}

/**
 * Response type representing cookie data retrieved from the browser profile
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
