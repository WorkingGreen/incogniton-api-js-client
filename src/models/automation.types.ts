export type Status = 'ok' | 'error';

/** Response for launching a Puppeteer session (default and custom endpoints). */
export interface PuppeteerLaunchResponse {
  /** HTTP URL to connect to the browser instance */
  puppeteerUrl: string;
  /** Status of the launch operation */
  status: Status;
}

/** Response for launching a Selenium session (default and custom endpoints). */
export interface SeleniumLaunchResponse {
  /** Status of the launch operation */
  status: Status;
}

/** Request body for launching a custom Puppeteer session. */
export interface LaunchPuppeteerCustomRequest {
  /** Profile identifier for the session (e.g., '7093ddfd-58d2-4c7a-b7e7-647d85be9c3f'). */
  profileID: string;
  /** Custom command-line arguments (e.g., '--headless=new'). */
  customArgs: string;
}

/** Request body for launching a custom Selenium session. Note: profile_id is a path parameter. */
export interface LaunchSeleniumCustomRequest {
  /** Custom command-line arguments (e.g., '--headless=new'). */
  customArgs: string;
}
