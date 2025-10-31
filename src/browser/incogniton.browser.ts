import { IncognitonClient } from '../api/incogniton.client.js';
import { BrowserProfile } from '../models/common.types.js';
import { BrowserConfig } from '../models/api.types.js';
import { HttpAgentBuilder } from '../utils/http/agent.js';
import { InitHttpAgent } from '../utils/http/provider.js';
import { logger } from '../utils/logger.js';
import { LoadingIndicator } from '../utils/loading-indicator.js';
import type { Browser } from 'puppeteer-core';
import  delay from '../utils/delay.js';
import type * as Playwright from 'playwright-core';
import http from 'http';
import https from 'https';

interface LaunchResponse {
  puppeteerUrl: string;
  [key: string]: unknown;
}

let puppeteer: typeof import('puppeteer-core');

/**
 * This Browser Client manages browser automation using Incogniton antidetect browser and Puppeteer
 */
export class IncognitonBrowser {
  private client: IncognitonClient;
  private config: BrowserConfig;
  private httpAgent: HttpAgentBuilder;

  /**
   * Creates a new Incogniton Browser instance.
   * @param {BrowserConfig} config Configuration options for the browser (optional).
   * The config object may include the following properties:
   * - `profileId` (string): The profile ID to use for the browser instance.
   * - `headless` (boolean): Whether to run the browser in headless mode (default: true).
   * - `customArgs` (string): Custom command-line arguments for the browser.
   * - `port` (number): Port number for the Incogniton local API (default: 35000).
   * - `launchTimeout` (number): Time in milliseconds to wait for the browser to launch (default: 35000).
   */
  constructor(config?: BrowserConfig) {
    this.config = {
      headless: true,
      port: 35000,
      launchTimeout: 60000,
      ...config,
    };
    this.client = new IncognitonClient();
    this.httpAgent = InitHttpAgent('incogniton-browser', `http://localhost:${this.config.port}`);
  }

  /**
   * Ensures puppeteer-core is available and imported
   * @private
   */
  private async ensurePuppeteer() {
    if (!puppeteer) {
      try {
        puppeteer = await import('puppeteer-core');
      } catch (err) {
        console.log('❌ [Puppeteer] Missing puppeteer-core dependency:', err);
        logger.error('Missing peer dependency: puppeteer-core is required for browser automation features');
        throw new Error('Missing peer dependency: puppeteer-core is required for browser automation features');
      }
    }
    return puppeteer;
  }

  /**
   * Starts a new browser instance with an automatically created profile (Puppeteer)
   * @param name `Optional` sets the name for profile
   * @param generalInfo `Optional` additional profile information like Notes, Browser OS, etc
   * @returns A connected Puppeteer browser instance
   * @throws Error if profile creation or browser launch fails
   */
  async quickstart(
    name?: string,
    generalInfo?: Partial<BrowserProfile['general_profile_information']>
  ): Promise<Browser> {
    try {
      // Create a new profile
      const timestamp = Date.now().toString().slice(-4);
      const profileData: BrowserProfile = {
        general_profile_information:{
          profile_name: `${name || `QProfile_${timestamp}`}`,
          profile_notes: "Created via Quickstart",
          ...generalInfo
        }
      };

      const { profile_browser_id } = await this.client.profile.add({profileData });
      logger.info('Created new profile:', profile_browser_id);

      // Update config with new profile ID
      this.config.profileId = profile_browser_id;

      // Start browser with new profile (default: Puppeteer)
      return this.startPuppeteer();
    } catch (error) {
      logger.error('Error in quickstart:', error);
      if (error instanceof Error) {
        throw new Error(`Quickstart failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Starts a new Incogniton browser instance using Puppeteer
   * @param {string} [profileId] Profile ID to use instead of the one in config (optional)
   * @returns A connected Puppeteer browser instance
   * @throws Error if browser launch fails
   */
  async startPuppeteer(profileId?: string): Promise<import('puppeteer-core').Browser> {
    try {
      console.log('🚀 [Puppeteer] Starting with profileId:', profileId || this.config.profileId);
      
      await this.ensurePuppeteer();

      const launchUrl = `/automation/launch/puppeteer`;
      const requestBody = {
        profileID: profileId || this.config.profileId,
        customArgs: this.config.headless ? '--headless=new' : this.config.customArgs || '',
      };
      
      console.log('🌐 [Puppeteer] API request to:', launchUrl, 'timeout:', this.config.launchTimeout);

      const response = await this.httpAgent
        .post(launchUrl)
        .set('Content-Type', 'application/json')
        .setBody(requestBody)
        .do(this.config.launchTimeout);
      
      const data = response as LaunchResponse;
      const { puppeteerUrl } = data;
      
      if (!puppeteerUrl) {
        throw new Error('No puppeteerUrl received from API response');
      }

      console.log('🔗 [Puppeteer] Got puppeteerUrl:', puppeteerUrl);

      const loadingIndicator = new LoadingIndicator();
      loadingIndicator.start('Launching Incogniton browser...this may take a few seconds.');

      // Wait for the browser CDP endpoint to be ready instead of a fixed sleep
      try {
        await this.waitForCDP(puppeteerUrl, this.config.launchTimeout, 1500);
      } finally {
        loadingIndicator.stop();
      }

      console.log('🔌 [Puppeteer] Connecting to browser...');
      const browser = await puppeteer.connect({
        browserURL: puppeteerUrl,
        ignoreHTTPSErrors: true,
      });
      
      console.log('✅ [Puppeteer] Connected successfully');
      
      logger.success(`${this.config.headless ? 'Browser' : 'Headless Browser'} connected via Puppeteer!\n\n`);
      logger.info('Press Ctrl+C to stop the browser.');
      
      process.removeAllListeners('SIGINT');
      process.once('SIGINT', async () => {
        logger.info('Closing browser...');
        await this.close(browser);
        process.exit(0);
      });
      
      return browser;
    } catch (error) {
      console.log('❌ [Puppeteer] FAILED:', error instanceof Error ? error.message : error);
      logger.error('Error starting Incogniton session (Puppeteer):', error);
      if (error instanceof Error) {
        throw new Error(`Failed to start browser (Puppeteer): ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Ensures playwright-core is available and imported
   * @private
   */
  private _playwright: typeof import('playwright-core') | undefined;
  
  private async ensurePlaywright() {
    if (!this._playwright) {
      try {
        this._playwright = await import('playwright-core');
      } catch (err) {
        console.log('❌ [Playwright] Missing playwright-core dependency:', err);
        logger.error('Missing peer dependency: playwright-core is required for Playwright automation features');
        throw new Error('Missing peer dependency: playwright-core is required for Playwright automation features');
      }
    }
    return this._playwright;
  }

  /**
   * Starts a new Incogniton browser instance using Playwright
   * @param {string} [profileId] Profile ID to use instead of the one in config (optional)
   * @returns A connected Playwright browser instance
   * @throws Error if browser launch fails
   */
  async startPlaywright(profileId?: string): Promise<import('playwright-core').Browser> {
    try {
      console.log('🚀 [Playwright] Starting with profileId:', profileId || this.config.profileId);
      
      const playwright = await this.ensurePlaywright();

      const launchUrl = `/automation/launch/puppeteer`;
      const requestBody = {
        profileID: profileId || this.config.profileId,
        customArgs: this.config.headless ? '--headless=new' : this.config.customArgs || '',
      };
      
      console.log('🌐 [Playwright] API request to:', launchUrl, 'timeout:', this.config.launchTimeout);

      const response = await this.httpAgent
        .post(launchUrl)
        .set('Content-Type', 'application/json')
        .setBody(requestBody)
        .do(this.config.launchTimeout);
      
      const data = response as LaunchResponse;
      const { puppeteerUrl } = data;
      
      if (!puppeteerUrl) {
        throw new Error('No puppeteerUrl received from API response');
      }

      console.log('🔗 [Playwright] Got puppeteerUrl:', puppeteerUrl);

      const loadingIndicator = new LoadingIndicator();
      loadingIndicator.start('Launching Incogniton browser...this may take a few seconds.');

      // Wait for the browser CDP endpoint to be ready instead of a fixed sleep
      try {
        await this.waitForCDP(puppeteerUrl, this.config.launchTimeout, 1500);
      } finally {
        loadingIndicator.stop();
      }

      console.log('🔌 [Playwright] Connecting to browser...');
      // Playwright expects ws:// or http:// endpoint for connectOverCDP
      const browser = await playwright.chromium.connectOverCDP(puppeteerUrl);
      
      console.log('✅ [Playwright] Connected successfully');
      
      logger.success(`${this.config.headless ? 'Browser' : 'Headless Browser'} connected via Playwright!\n\n`);
      logger.info('Press Ctrl+C to stop the browser.');
      
      process.removeAllListeners('SIGINT');
      process.once('SIGINT', async () => {
        logger.info('Closing browser...');
        await this.close(browser);
        process.exit(0);
      });
      
      return browser;
    } catch (error) {
      console.log('❌ [Playwright] FAILED:', error instanceof Error ? error.message : error);
      logger.error('Error starting Incogniton session (Playwright):', error);
      if (error instanceof Error) {
        throw new Error(`Failed to start browser (Playwright): ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Tests the browser's fingerprinting resistance using IPHey
   * @param browser The Puppeteer browser instance to test
   * @returns The IPHey test result
   */
  async testFingerprint(browser: Browser): Promise<string> {
    try {
      logger.info('Running IPHey fingerprinting test...');
      const page = await browser.newPage();

      // Navigate to IPHey and wait for network idle
      await page.goto('https://iphey.com/', { waitUntil: 'networkidle0' });

      // Check for trustworthy status
      const result = await page.$eval(
        '.identity-status span:not(.hide)',
        element => element?.textContent?.trim() || ''
      );

      await page.close();
      return result;
    } catch (error) {
      logger.error('IPHey test failed:', error);
      if (error instanceof Error) {
        throw new Error(`Fingerprinting test failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Closes all Incogniton browser instances
   * @param browsers Array of Puppeteer browser instances to close
   */
  async closeAll(browsers: Browser[]): Promise<void> {
    try {
      logger.info(`Closing ${browsers.length} browser instances...`);

      // Close all browser instances
      await Promise.all(browsers.map(browser => this.close(browser)));

      logger.info('All browser instances closed successfully');
    } catch (error) {
      logger.error('Failed to close browser instances:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to close browser instances: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Closes the browser instance (supports both Puppeteer and Playwright)
   * @param browser The Puppeteer or Playwright browser instance to close
   */
  async close(browser: import('puppeteer-core').Browser | import('playwright-core').Browser): Promise<void> {
    try {
      // Type guard: Playwright Browser has 'isConnected' and 'newContext', Puppeteer has 'process'
      if (typeof (browser as any).close === 'function') {
        await browser.close();
        logger.info('Browser closed successfully');
      } else {
        logger.error('Unknown browser instance type, cannot close');
      }
    } catch (error) {
      logger.error('Failed to close browser:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to close browser: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Polls the browser CDP endpoint (/json/version) until it becomes available or a timeout occurs.
   * This avoids using fixed delays and makes connecting more reliable.
   * @param url The base puppeteer/CDP url returned by Incogniton (e.g. http://127.0.0.1:XXXXX)
  * @param timeoutMs Maximum time to wait in milliseconds (default 60s)
   * @param intervalMs Poll interval in milliseconds (default 1500)
   */
  private async waitForCDP(url: string, timeoutMs = 60000, intervalMs = 1500): Promise<void> {
    const endpoint = `${url.replace(/\/$/, '')}/json/version`;
    const deadline = Date.now() + timeoutMs;

    const isHttp = endpoint.startsWith('http://');

    // Exponential backoff parameters
    const maxIntervalMs = 2000; // don't back off beyond this
    let currentInterval = Math.max(200, intervalMs);
    let attempt = 0;

    while (Date.now() < deadline) {
      attempt++;
      // Make per-request timeout slightly shorter than the interval to avoid serial waits
      const perRequestTimeout = Math.max(150, Math.min(1000, currentInterval - 100));

      const start = Date.now();
      try {
        await new Promise<void>((resolve, reject) => {
          const lib = isHttp ? http : https;
          const req = lib.get(endpoint, (res) => {
            if (res.statusCode === 200) {
              res.resume();
              resolve();
            } else {
              res.resume();
              reject(new Error(`CDP not ready, status ${res.statusCode}`));
            }
          });

          req.on('error', (err) => {
            reject(err);
          });

          // per-request safety timeout
          req.setTimeout(perRequestTimeout, () => {
            req.destroy(new Error('Request timed out'));
          });
        });

        // success
        return;
      } catch (err) {
        // ignore and continue to backoff
      }

      const elapsed = Date.now() - start;
      // Sleep the remainder of the interval (if any) to keep cadence predictable
      const sleepMs = Math.max(0, currentInterval - elapsed);
      if (sleepMs > 0) await delay(sleepMs);

      // Backoff: increase interval after the first few attempts
      if (attempt >= 3) {
        currentInterval = Math.min(maxIntervalMs, currentInterval * 2);
      }
    }

    throw new Error(`CDP endpoint did not become ready within ${timeoutMs}ms: ${endpoint}`);
  }
}
