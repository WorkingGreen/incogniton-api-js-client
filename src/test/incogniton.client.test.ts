// Allow longer timeouts for integration/browser tests
jest.setTimeout(180000);

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

// describe('IncognitonBrowser - Puppeteer Launch', () => {
//   let client: IncognitonClient;
//   let profileId: string;

//   beforeEach(() => {
//     client = new IncognitonClient();
//   });

//   // No global afterEach cleanup — each test will perform its own close/stop/delete

//   it('should launch and close browser with Puppeteer', async () => {
//     // Step 1: Add a profile
//     const profileData = {
//       profileData: {
//         general_profile_information: {
//           profile_name: 'Test — Unblocked P Automation',
//           profile_notes: 'Testing Unblocked automation',
//           simulated_operating_system: 'Windows',
//           profile_browser_version: '141',
//         },
//         Navigator: {
//           user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Checkly Safari/537.36",
//         },
//         UnblockedFreeProxySettings: {
//           unblocked_free_proxy_enabled: true,
//           unblocked_free_proxy_country: "us"
//         },
//       },
//     };
//     const addResponse = await client.profile.add(profileData);
//     expect(addResponse.status).toBe('ok');
//     profileId = addResponse.profile_browser_id ?? '';

//     const browserClient = new IncognitonBrowser({ profileId, headless: true });
    
//     // Puppeteer test
//     const puppeteerBrowser = await browserClient.startPuppeteer(profileId);
//     expect(puppeteerBrowser).toBeDefined();

//     // Simple automation: open page, screenshot
//     const page = await puppeteerBrowser.newPage();
//     console.log("🚀 ~ page:", page)
//     await page.goto('https://incogniton.com/blog');

//     const screenshotPathP = './puppeteer-example-screenshot.png';
//     const screenshotBuffer = await page.screenshot({ path: screenshotPathP, fullPage: true });
//     console.log('[Puppeteer Test] Screenshot Path:', { screenshotPath: screenshotPathP });
//     // expect(screenshotBuffer).toBeDefined();
//     await page.close();
//   // Close browser client and stop profile
//   await browserClient.close(puppeteerBrowser);

//   await client.profile.forceStop(profileId);
//   // Delete profile and clear id
//   await client.profile.delete(profileId);
//   profileId = '';
    
//   });
// });




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
        Navigator: {
             user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Checkly Safari/537.36",
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

    
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Checkly",
    });
    const page = await context.newPage();
    await page.goto('https://incogniton.com/blog');
    await page.waitForLoadState('load');

    const ua = await page.evaluate(() => (globalThis as any).navigator.userAgent);
    console.log('[Playwright Test] UA:', ua);

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

// TODO: @rens23
// describe('Incogniton Checkout Flow Test', () => {
//   let client: IncognitonClient;
//   let profileId: string;
//   let browserClient: IncognitonBrowser;
//   let browser: any;

//   beforeEach(() => {
//     client = new IncognitonClient();
//   });

//   // No afterEach here — tests will close browsers and delete profiles themselves.


//   it('should run checkout flow (skeleton) ', async () => {
//     // Step 1: Add a profile
//     const profileData = {
//       profileData: {
//         general_profile_information: {
//           profile_name: 'Test — Unblocked Playwright',
//           profile_notes: 'Testing Playwright automation',
//           simulated_operating_system: 'Windows',
//           profile_browser_version: '141',
//         },
//         Navigator: {
//              user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Checkly Safari/537.36",
//         },
//         UnblockedFreeProxySettings: {
//           unblocked_free_proxy_enabled: true,
//           unblocked_free_proxy_country: "us"
//         },
//       },
//     };
//     const addResponse = await client.profile.add(profileData);
//     console.log("🚀 ~ addResponse:", addResponse)
//     expect(addResponse.status).toBe('ok');
//     profileId = addResponse.profile_browser_id ?? '';

//     browserClient = new IncognitonBrowser({ profileId, headless: true });
    
//     // Playwright test
//     browser = await browserClient.startPlaywright(profileId);
//     expect(browser).toBeDefined();

    
//     const context = await browser.newContext({
//       userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Checkly",
//     });
//     const page = await context.newPage();
//     console.log('[Playwright Test] Page URL:', { pageUrl: page.url() });
    
//     // ACTUAL LOGIC
//     const TEST_USER = 'YOUR_EMAIL';
//     const TEST_PASS = 'YOUR_PASSWORD';

//     const usernameSelector = '#username';
//     const passwordSelector = 'input[name="password"]';
//     const loginButtonSelector = 'button[name="login"], .woocommerce-form-login__submit';
    
//     // Go to my-account and wait for full page load
//     await page.goto('https://incogniton.com/my-account', { waitUntil: 'load', timeout: 30_000 });
    
//     // 3 seconds delay
//     await new Promise(resolve => setTimeout(resolve, 3000));

//     await page.screenshot({ path: './my-account-before-fill.png', fullPage: true });
    
//     // Fill username & password
//     await page.fill(usernameSelector, TEST_USER);
//     await page.fill(passwordSelector, TEST_PASS);
    
//     // Wait 5 seconds for Turnstile / Cloudflare checks to complete
//     await page.waitForTimeout(5_000);

//     // take a screenshot of the page
//     await page.screenshot({ path: './my-account-before-submit.png', fullPage: true });
    
//     // Submit the form and wait for navigation/network idle
//     await Promise.all([
//       page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30_000 }).catch(() => null),
//       page.click(loginButtonSelector),
//     ]);
    
//     // Optional screenshot after submit
//     await page.screenshot({ path: './my-account-after-submit.png', fullPage: true });

//     // 2. Go to the pricing page  
//     await page.goto('https://incogniton.com/pricing', { waitUntil: 'load', timeout: 30_000 });

//     // Click Get Free Package
//     await page.click('a[href="/?add-to-cart=4548961"]');

//     // Wait for the page to load
//     await page.waitForLoadState('load', { timeout: 30_000 });

//     // 3. Click Checkout button
//     await page.click('a[href="https://incogniton.com/checkout/"]');

//     //4. Complete subscription/order process
//     await page.waitForSelector('#payment', { state: 'visible' });
//     if (!(await page.isChecked('#terms'))) await page.check('#terms');
//     await page.click('#place_order');

//     const screenshotPathPW = './my-account-subscribe-page.png';
//     logger.info('[Playwright Test] Screenshot Path:', { screenshotPath: screenshotPathPW });
//     const screenshotBuffer = await page.screenshot({ path: screenshotPathPW, fullPage: true });
//     expect(screenshotBuffer).toBeDefined();

//     await page.close();
//     await client.profile.forceStop(profileId);
//     // Close the browser connection and delete profile
//     await browserClient.close(browser);
//     browser = null;
//     await client.profile.delete(profileId);
//     profileId = '';
    
//   }, 180000);
// });