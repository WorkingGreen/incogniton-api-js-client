// Allow longer timeouts for integration/browser tests
jest.setTimeout(120000);

import { IncognitonClient } from '../api/incogniton.client.js';
import { logger } from '../utils/logger.js';
import { IncognitonBrowser } from '../browser/incogniton.browser.js';

// Integration/browser tests (Playwright) run by default in this test file.

describe('IncognitonClient', () => {
  let client: IncognitonClient;

  beforeEach(() => {
    client = new IncognitonClient();
  });

  it('should create client instance', () => {
    expect(client).toBeInstanceOf(IncognitonClient);
  });

  it('should fetch all profiles', async () => {
    const response: any = await client.profile.list();
    logger.info('[Test] Profile List - First Profile Information:', {
      profileInfo: response.profileData[0].general_profile_information,
    });

    expect(response.status).toBe('ok');
    expect(Array.isArray(response.profileData)).toBe(true);
    expect(response.profileData.length).toBeGreaterThan(0);
    expect(response.profileData[0]).toHaveProperty('general_profile_information.browser_id');
  });
});

// describe('IncognitonClient - Full Profile Lifecycle', () => {
//   let client: IncognitonClient;
//   let profileId: string;

//   beforeEach(() => {
//     client = new IncognitonClient();
//   });

//   afterEach(async () => {
//     if (profileId) {
//       try {
//         await client.profile.delete(profileId);
//       } catch (error) {
//         logger.error('Failed to cleanup profile:', { error });
//       }
//     }
//   });

//   it('should add, launch, stop, and delete a profile', async () => {
//     // Step 1: Add a profile
//     const profileData = {
//       profileData: {
//         general_profile_information: {
//           profile_name: 'Test Profile',
//           profile_notes: 'Testing 1,2,3',
//           simulated_operating_system: 'Windows', 
//           profile_browser_version: '140',
//         },
//       },
//     };

//     const addResponse = await client.profile.add(profileData);
//     logger.info('[Test] Step 1 - Profile Creation - Response:', { addResponse });
//     expect(addResponse.status).toBe('ok');
//     expect(typeof addResponse.profile_browser_id).toBe('string');

//     profileId = addResponse.profile_browser_id ?? '';

//     // Step 2: Launch Puppeteer with the profile ID
//     const launchResponse = await client.automation.launchPuppeteer(profileId);
//     logger.info('[Test] Step 2 - Browser Launch - Response:', { launchResponse });
//     expect(launchResponse.status).toBe('ok');

//     // Step 3: Stop the profile
//     const stopResponse = await client.profile.stop(profileId);
//     logger.info('[Test] Step 3 - Profile Stop - Response:', { stopResponse });
//     expect(stopResponse.status).toBe('ok');
//     expect(stopResponse.message).toBe('Profile stopped');

//     // Step 4: Delete the profile
//     const deleteResponse = await client.profile.delete(profileId);
//     logger.info('[Test] Step 4 - Profile Deletion - Response:', { deleteResponse });
//     expect(deleteResponse.status).toBe('ok');
//     expect(deleteResponse.message).toBe('profile removed');

//     // Clear profileId after successful deletion
//     profileId = '';
//   }, 60000); // 60s timeout for real API calls
// });

describe('IncognitonBrowser - Puppeteer Launch', () => {
  let client: IncognitonClient;
  let profileId: string;

  beforeEach(() => {
    client = new IncognitonClient();
  });

  // No global afterEach cleanup — each test will perform its own close/stop/delete

  it('should launch and close browser with Puppeteer', async () => {
    // Step 1: Add a profile
    const profileData = {
      profileData: {
        general_profile_information: {
          profile_name: 'Test — Unblocked P Automation',
          profile_notes: 'Testing Unblocked automation',
          simulated_operating_system: 'Windows',
          profile_browser_version: '141',
        },
        UnblockedFreeProxySettings: {
          unblocked_free_proxy_enabled: true,
          unblocked_free_proxy_country: "us"
        },
      },
    };
    const addResponse = await client.profile.add(profileData);
    expect(addResponse.status).toBe('ok');
    profileId = addResponse.profile_browser_id ?? '';

    const browserClient = new IncognitonBrowser({ profileId, headless: true });
    
    // Puppeteer test
    const puppeteerBrowser = await browserClient.startPuppeteer(profileId);
    expect(puppeteerBrowser).toBeDefined();

    // Simple automation: open page, screenshot
    const page = await puppeteerBrowser.newPage();
    console.log("🚀 ~ page:", page)
    await page.goto('https://incogniton.com/blog');

    const screenshotPath = './puppeteer-example-screenshot.png';
    const screenshotBuffer = await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('[Puppeteer Test] Screenshot Path:', { screenshotPath });
    // expect(screenshotBuffer).toBeDefined();
    await page.close();
  // Close browser client and stop profile
  await browserClient.close(puppeteerBrowser);

  await client.profile.forceStop(profileId);
  // Delete profile and clear id
  await client.profile.delete(profileId);
  profileId = '';
    
  });
});

describe('IncognitonBrowser - Playwright Launch', () => {
  let client: IncognitonClient;
  let profileId: string;
  let browserClient: IncognitonBrowser;
  let browser: any;

  beforeEach(() => {
    client = new IncognitonClient();
  });

  // No afterEach here — tests will close browsers and delete profiles themselves.

  it('should launch and close browser with Playwright', async () => {
    // Step 1: Add a profile
    const profileData = {
      profileData: {
        general_profile_information: {
          profile_name: 'Test — Unblocked Playwright',
          profile_notes: 'Testing Playwright automation',
          simulated_operating_system: 'Windows',
          profile_browser_version: '141',
        },
        UnblockedFreeProxySettings: {
          unblocked_free_proxy_enabled: true,
          unblocked_free_proxy_country: "de"
        },
      },
    };
    const addResponse = await client.profile.add(profileData);
    expect(addResponse.status).toBe('ok');
    profileId = addResponse.profile_browser_id ?? '';

    browserClient = new IncognitonBrowser({ profileId, headless: true });
    
    // Playwright test
    browser = await browserClient.startPlaywright(profileId);
    expect(browser).toBeDefined();

    // Simple automation: open page, screenshot
    const page = await browser.newPage();
    await page.goto('https://incogniton.com/blog');
    await page.waitForLoadState('load');

    logger.info('[Playwright Test] Page URL:', { pageUrl: page.url() });
    const screenshotPath = './playwright-example-screenshot.png';
    logger.info('[Playwright Test] Screenshot Path:', { screenshotPath });
    const screenshotBuffer = await page.screenshot({ path: screenshotPath, fullPage: true });
    expect(screenshotBuffer).toBeDefined();
    await page.close();
  await client.profile.forceStop(profileId);
  // Close the browser connection and delete profile
  await browserClient.close(browser);
  browser = null;
  await client.profile.delete(profileId);
  profileId = '';
    
  });
});
