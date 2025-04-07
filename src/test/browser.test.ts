import { IncognitonBrowser } from '../browser/incogniton.browser';
import { Browser } from 'puppeteer-core';

describe('IncognitonBrowser', () => {
  let browser: Browser;
  const testProfileId = 'test-profile-id';

  afterEach(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('should start a browser instance', async () => {
    const incognitonBrowser = new IncognitonBrowser({
      profileId: testProfileId,
      headless: true,
    });

    browser = await incognitonBrowser.start();
    expect(browser).toBeDefined();
  });

  it('should test fingerprinting resistance', async () => {
    const incognitonBrowser = new IncognitonBrowser({
      profileId: testProfileId,
      headless: true,
    });

    browser = await incognitonBrowser.start();
    const result = await incognitonBrowser.testFingerprint(browser);
    expect(result).toBeDefined();
  });

  it('should handle browser start errors', async () => {
    const incognitonBrowser = new IncognitonBrowser({
      profileId: 'invalid-profile-id',
      headless: true,
    });

    await expect(incognitonBrowser.start()).rejects.toThrow();
  });
});
