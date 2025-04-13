import { IncognitonClient } from '../api/incogniton.client';
import { IncognitonBrowser } from '../browser/incogniton.browser';
import { logger } from '../utils/logger';
import { CreateBrowserProfileRequest } from '../models/common.types';

// Simple profile data for testing
const profileData: CreateBrowserProfileRequest = {
  profileData: {
    general_profile_information: {
      profile_name: 'John doe',
      profile_notes: 'Test profile created via API',
      profile_group: 'Test Group',
      profile_last_edited: new Date().toISOString(),
      simulated_operating_system: 'Windows',
      profile_browser_version: '120',
      browser_id: '',
    },
    Proxy: {
      connection_type: 'http',
      proxy_url: '127.0.0.1:8080',
      proxy_username: '',
      proxy_password: '',
    },
    Timezone: {
      fill_timezone_based_on_ip: false,
      timezone_offset: '+00:00',
      timezone_name: 'UTC',
    },
    WebRTC: {
      behavior: 'Masked',
      set_external_ip: true,
      local_ip: '',
      public_ip: '',
    },
    Navigator: {
      platform: 'Win32',
      user_agent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      screen_resolution: '1920x1080',
      languages: 'en-US,en',
      do_not_track: false,
      hardware_concurrency: 4,
    },
    Other: {
      browser_allowRealMediaDevices: false,
      active_session_lock: false,
      other_ShowProfileName: false,
      custom_browser_args_enabled: false,
      browser_language_lock: false,
      custom_browser_language: '',
      custom_browser_args_string: '',
    },
  },
};

// Test function for adding a profile
async function testAddProfile() {
  try {
    const client = new IncognitonClient();
    const response = await client.profile.add(profileData);
    logger.info('Profile added successfully:', response);
    return response;
  } catch (error) {
    logger.error('Failed to add profile:', error);
    throw error;
  }
}

// Test function for starting browser
async function testStartBrowser() {
  try {
    const incognitonBrowser = new IncognitonBrowser({
      profileId: 'b2f707c5-924e-428e-8bf9-502781074c6e',
      headless: false,
    });

    logger.info('Starting browser...');
    const browser = await incognitonBrowser.start();

    // Verify browser connection
    logger.info(`Browser started successfully`);

    return browser;
  } catch (error) {
    logger.error('Failed to start browser:', error);
    if (error instanceof Error) {
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
}

// Test function for fingerprinting
async function testFingerprinting(browser: any) {
  try {
    const incognitonBrowser = new IncognitonBrowser({
      profileId: 'b2f707c5-924e-428e-8bf9-502781074c6e',
      headless: false,
      launchTimeout: 60000, // Increase timeout to 60 seconds
    });
    const result = await incognitonBrowser.testFingerprint(browser);
    logger.info('Fingerprinting test completed:', result);
    return result;
  } catch (error) {
    logger.error('Fingerprinting test failed:', error);
    throw error;
  }
}

// Test runner
async function runTests() {
  let browser: any = null;
  try {
    // Test browser start
    logger.info('Testing browser start...');
    // browser = await testStartBrowser();
    browser = await testAddProfile();
    logger.info('Browser start test completed successfully!');
  } catch (error) {
    logger.error('Test suite failed:', error);
    if (error instanceof Error) {
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    process.exit(1);
  }
}

// Run the tests
runTests();
