import { IncognitonClient } from '../api/incogniton.client.js';
import { IncognitonBrowser } from '../browser/incogniton.browser.js';
import type { CreateBrowserProfileRequest } from '../models/common.types.js';
import { logger } from '../utils/logger.js';

// Simple profile data for testing
const addProfileEntry = {
  profileData: {
    general_profile_information: {
      profile_name: 'QProfile Profile',
      profile_notes: 'Test Notes',
      profile_group: 'Test Group',
      profile_last_edited: new Date().toISOString(),
      simulated_operating_system: 'Windows',
  profile_browser_version: '140',
    },
    Proxy: {
      connection_type: 'http',
      proxy_url: '127.0.0.1:8080',
      proxy_username: '',
      proxy_password: '',
    },
  }
};

// Test function for adding a profile
async function testAddProfile() {
  try {
    const client = new IncognitonClient();
    const response = await client.profile.add(addProfileEntry);
    logger.info('Profile addition response:', response);
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
      headless: true,
    });

    logger.info('Starting browser...');
    const browser = await incognitonBrowser.quickstart('MY QUICK PROFILE');
    incognitonBrowser.testFingerprint(browser);

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
      headless: true,
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

// Test function for updating a profile
async function testUpdateProfile(profileId: string) {
  try {
    const client = new IncognitonClient();
    // Create the data in the exact format that works
    const updatedData = {
      profileData: {
        profile_browser_id: profileId,
        general_profile_information: {
          profile_name: 'Send Boys',
          profile_notes: '', 
          profile_group: 'Unassigned',
          profile_last_edited: new Date().toISOString(),
          simulated_operating_system: 'Windows'
        }
      }
    };
    
    const response = await client.profile.update(profileId, updatedData);
    logger.info('Profile updated successfully:', response);
    return response;
  } catch (error) {
    logger.error('Failed to update profile:', error);
    throw error;
  }
}

// Test runner
async function runTests() {
  try {
    const incog = new IncognitonBrowser();
  const browser = await incog.quickstart();
  const fingerprintResult = await incog.testFingerprint(browser);
    console.log("🚀 ~ runTests ~ fingerprintResult:", fingerprintResult)
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
runTests();
