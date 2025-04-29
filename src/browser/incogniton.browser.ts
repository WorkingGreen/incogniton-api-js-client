import { IncognitonClient } from '../api/incogniton.client.js';
import { BrowserProfile } from '../models/common.types.js';
import { BrowserConfig } from '../models/api.types.js';
import { HttpAgentBuilder } from '../utils/http/agent.js';
import { InitHttpAgent } from '../utils/http/provider.js';
import { logger } from '../utils/logger.js';
import { LoadingIndicator } from '../utils/loading-indicator.js';
import type { Browser } from 'puppeteer-core';

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
      launchTimeout: 35000,
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
        logger.error('Missing peer dependency: puppeteer-core is required for browser automation features');
        throw new Error('Missing peer dependency: puppeteer-core is required for browser automation features');
      }
    }
    return puppeteer;
  }

  /**
   * Starts a new browser instance with an automatically created profile
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

      // Start browser with new profile
      return this.start();
    } catch (error) {
      logger.error('Error in quickstart:', error);
      if (error instanceof Error) {
        throw new Error(`Quickstart failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Starts a new Incogniton browser instance with the specified configuration and profile
   * @param {string} [profileId] Profile ID to use instead of the one in config (optional)
   * @returns A connected Puppeteer browser instance
   * @throws Error if browser launch fails
   */
  async start(profileId?: string): Promise<Browser> {
    try {
      await this.ensurePuppeteer();
      
      const launchUrl = `/automation/launch/puppeteer`;
      const requestBody = {
        profileID: profileId || this.config.profileId,
        customArgs: this.config.headless ? '--headless=new' : this.config.customArgs || '',
      };
      // Make a POST request with body data using HttpAgentBuilder
      const response = await this.httpAgent
        .post(launchUrl)
        .set('Content-Type', 'application/json')
        .setBody(requestBody)
        .do(this.config.launchTimeout);

      const data = response as LaunchResponse;
      logger.info('Browser launch response:', data);
      const { puppeteerUrl } = data;

      // Wait for the browser to launch
      const loadingIndicator = new LoadingIndicator();
      loadingIndicator.start('Launching Incogniton browser...this may take a few seconds.');
      // Wait for the browser to be ready
      await new Promise(resolve => setTimeout(resolve, this.config.launchTimeout));
      loadingIndicator.stop();

      // Connect to browser
      const browser = await puppeteer.connect({
        browserURL: puppeteerUrl,
        ignoreHTTPSErrors: true,
      });

      logger.success(`${this.config.headless ? 'Browser' : 'Headless Browser'} connected!\n\n`);
      logger.info('Press Ctrl+C to stop the browser.');
      
      // Remove existing SIGINT handlers to prevent duplicates
      process.removeAllListeners('SIGINT');
      
      // Setup SIGINT handler for graceful shutdown using once
      process.once('SIGINT', async () => {
        logger.info('Closing browser...');
        await this.close(browser);
        process.exit(0);
      });

      return browser;
    } catch (error) {
      logger.error('Error starting Incogniton session:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to start browser: ${error.message}`);
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
   * Closes the browser instance
   * @param browser The Puppeteer browser instance to close
   */
  async close(browser: Browser): Promise<void> {
    try {
      await browser.close();
      logger.info('Browser closed successfully');
    } catch (error) {
      logger.error('Failed to close browser:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to close browser: ${error.message}`);
      }
      throw error;
    }
  }
}
