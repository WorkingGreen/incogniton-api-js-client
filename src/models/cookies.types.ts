/**
 * Represents a single cookie object as returned by the API or used in encoded form.
 */
export interface Cookie {
  path: string;
  session: boolean;
  domain: string;
  hostOnly: boolean;
  sameSite: string;
  name: string;
  httpOnly: boolean;
  secure: boolean;
  value: string;
  expirationDate: number;
}

/**
 * Represents the request body for the POST /profile/addCookie endpoint.
 * This interface defines the structure required to add a cookie to a specified profile in the Incogniton system.
 * The cookie data must be provided in a Base64-encoded JSON format.
 */
export interface AddCookieRequest {
  /** The unique identifier of the profile in Incogniton to which the cookie will be added. */
  profile_browser_id: string;
  /** The format of the cookie data. Must be set to 'base64json'. */
  format: 'base64json';
  /** A Base64-encoded JSON string representing an array of Cookie objects. */
  cookie: string;
}

/**
 * Represents the response body for the POST /profile/addCookie endpoint.
 * This interface defines the structure of the response returned after successfully adding a cookie to a profile.
 * It returns the request data, confirming the addition.
 */
export interface AddCookieResponse {
  profile_browser_id: string;
  format: 'base64json';
  cookie: string;
}

/**
 * Represents the response body for the GET /profile/cookie/{profile_id} endpoint.
 * This interface defines the structure of the response when retrieving cookie data for a specific profile.
 * It includes an array of cookies and a status message indicating the result of the operation.
 */
export interface GetCookieResponse {
  CookieData: Cookie[];
  message: string;
  status: 'ok' | 'error';
}

/**
 * Represents the response body for the GET /profile/deleteCookie/{profile_id} endpoint.
 * This interface defines the structure of the response after deleting cookies from a specified profile.
 * It includes a confirmation message and a status indicating the result of the deletion.
 */
export interface DeleteCookieResponse {
  message: string;
  status: 'ok' | 'error';
}
