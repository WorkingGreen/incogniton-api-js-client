import puppeteer, { Browser, ConnectOptions } from 'puppeteer-core';
import { IncognitonClient } from '../api/incogniton.client';
import { logger } from '../utils/logger';
import { HttpAgentBuilder } from '../utils/http/agent';
import { InitHttpAgent } from '../utils/http/provider';

/**
 * Configuration options for launching an Incogniton browser instance
 */
export interface BrowserConfig {
  /** The profile ID to use for the browser instance */
  profileId: string;
  /** Whether to launch in headless mode */
  headless?: boolean;
  /** Custom command-line arguments for the browser */
  customArgs?: string;
  /** Port number for the Incogniton instance (default: 35000) */
  port?: number;
  /** Time to wait for browser launch in milliseconds (default: 30000) */
  launchTimeout?: number;
}

interface LaunchResponse {
  puppeteerUrl: string;
  [key: string]: unknown;
}

/**
 * A class that manages browser automation using Incogniton and Puppeteer
 */
export class IncognitonBrowser {
  private client: IncognitonClient;
  private config: BrowserConfig;
  private httpAgent: HttpAgentBuilder;

  /**
   * Creates a new IncognitonBrowser instance
   * @param config Configuration options for the browser
   */
  constructor(config: BrowserConfig) {
    this.config = {
      headless: false,
      port: 35000,
      launchTimeout: 35000,
      ...config,
    };
    this.client = new IncognitonClient();
    this.httpAgent = InitHttpAgent('incogniton-browser', `http://localhost:${this.config.port}`);
  }

  /**
   * Starts a new Incogniton browser instance with the specified configuration
   * @returns A connected Puppeteer browser instance
   * @throws Error if browser launch fails
   */
  async start(): Promise<Browser> {
    try {
      const launchUrl = `/automation/launch/puppeteer`;
      const requestBody = {
        profileID: this.config.profileId,
        customArgs: this.config.headless ? '--headless=new' : this.config.customArgs || '',
      };

      // Make a POST request with body data using HttpAgentBuilder
      const response = await this.httpAgent
        .post(launchUrl)
        .set('Content-Type', 'application/json')
        .setBody(requestBody)
        .do();

      const data = response as LaunchResponse;
      logger.info('Browser launch response:', data);
      const { puppeteerUrl } = data;

      // Wait for the browser to launch
      logger.info('The Incogniton browser is launching...');
      await new Promise(resolve => setTimeout(resolve, this.config.launchTimeout));

      // Connect to browser
      const browser = await puppeteer.connect({
        browserURL: puppeteerUrl,
        ignoreHTTPSErrors: true,
      });

      logger.info('Successfully connected to browser');
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
        '.trustworthy-status:not(.hide)',
        element => element?.textContent?.trim() || ''
      );

      await page.close();
      logger.info(`IPHey test result: ${result}`);
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
