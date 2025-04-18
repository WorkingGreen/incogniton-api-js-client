/**
 * Represents general information about a browser profile.
 */
export interface GeneralProfileInformation {
  /** The name of the profile. */
  profile_name: string;
  /** Optional notes for the profile. */
  profile_notes?: string;
  /** Optional group to which the profile belongs. */
  profile_group?: string;
  /** Timestamp when the profile was last edited. */
  profile_last_edited?: string;
  /** The simulated operating system for the profile. */
  simulated_operating_system?: string;
  /** The version of the browser used in the profile. */
  profile_browser_version?: string;
}

/**
 * Represents proxy configuration for a browser profile.
 */
export interface Proxy {
  /** The type of connection used by the proxy. */
  connection_type: string;
  /** The URL of the proxy server. */
  proxy_url: string;
  /** Optional username for proxy authentication. */
  proxy_username?: string;
  /** Optional password for proxy authentication. */
  proxy_password?: string;
  /** Optional number indicating if the proxy rotates. */
  proxy_rotating?: number;
  /** Optional proxy provider name. */
  proxy_provider?: string;
}

/**
 * Represents timezone settings for a browser profile.
 */
export interface Timezone {
  /** Determines if the timezone should be filled based on the IP address. */
  fill_timezone_based_on_ip: boolean;
  /** The name of the timezone (optional). */
  timezone_name?: string;
  /** The numeric offset of the timezone (optional). */
  timezone_offset?: number;
}

/**
 * Represents WebRTC configuration for a browser profile.
 */
export interface WebRTC {
  /** Determines if an external IP should be set for WebRTC. */
  set_external_ip: boolean;
  /** The behavior setting for WebRTC (e.g., leak prevention mode). */
  behavior: string;
  /** The public IP used for WebRTC (optional). */
  public_ip?: string;
  /** The local IP used for WebRTC (optional). */
  local_ip?: string;
}

/**
 * Represents navigator-related information for a browser profile.
 */
export interface Navigator {
  /** The user agent string of the browser. */
  user_agent: string;
  /** The screen resolution of the device. */
  screen_resolution: string;
  /** Whether the navigator user agent matches Chrome core. */
  navigator_useragent_match_chrome_core: boolean;
  /** The languages supported by the browser. */
  languages: string;
  /** A toggle value for language-based IP behavior. */
  navigator_languageIPToggle: number;
}

/**
 * Represents a complete browser profile in Incogniton.
 */
export interface BrowserProfile {
  /** Unique identifier for the profile. */
  id: string;
  /** The name of the profile. */
  name: string;
  /** General profile information. */
  general: GeneralProfileInformation;
  /** Optional proxy configuration. */
  proxy?: Proxy;
  /** Timezone settings for the profile. */
  timezone: Timezone;
  /** WebRTC configuration. */
  webrtc: WebRTC;
  /** Navigator-related information. */
  navigator: Navigator;
  /** Timestamp when the profile was created. */
  createdAt: string;
  /** Timestamp when the profile was last updated. */
  updatedAt: string;
}

/**
 * Request payload for creating a new browser profile.
 */
export interface CreateBrowserProfileRequest {
  /** The name of the new profile. */
  name: string;
  /** General profile details. */
  general: GeneralProfileInformation;
  /** Optional proxy configuration. */
  proxy?: Proxy;
  /** Timezone settings for the profile. */
  timezone: Timezone;
  /** WebRTC configuration. */
  webrtc: WebRTC;
  /** Navigator-related information. */
  navigator: Navigator;
}

/**
 * Profile status as returned by the API
 */
export type ProfileStatus = 'ready' | 'launching' | 'launched' | 'syncing' | 'synced';

/**
 * Request payload for updating an existing browser profile.
 */
export interface UpdateBrowserProfileRequest {
  /** New profile name (optional). */
  name?: string;
  /** Partial update to general profile information (optional). */
  general?: Partial<GeneralProfileInformation>;
  /** Partial update to proxy configuration (optional). */
  proxy?: Partial<Proxy>;
  /** Partial update to timezone settings (optional). */
  timezone?: Partial<Timezone>;
  /** Partial update to WebRTC configuration (optional). */
  webrtc?: Partial<WebRTC>;
  /** Partial update to navigator information (optional). */
  navigator?: Partial<Navigator>;
}
