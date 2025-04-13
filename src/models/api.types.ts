/**
 * @module models/api
 */

import type { BaseResponse } from './common.types';
import type {
  CreateBrowserProfileRequest as BrowserProfileRequest,
  UpdateBrowserProfileRequest as BrowserProfileUpdateRequest,
  ProfileStatus,
} from './browser-profile.types';

export interface ApiResponse<T> extends BaseResponse {
  data: T;
}

export interface ApiError extends BaseResponse {
  error: string;
}

/**
 * Re-export browser profile types with descriptive names
 */
export type CreateBrowserProfileRequest = BrowserProfileRequest;
export type UpdateBrowserProfileRequest = BrowserProfileUpdateRequest;

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

/**
 * Response type for proxy switching operation
 */
export interface SwitchProxyResponse extends BaseResponse {
  data: {
    status: 'ok' | 'error';
  };
}
