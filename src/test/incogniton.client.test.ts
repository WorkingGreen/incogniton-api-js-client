import { jest } from '@jest/globals';
import { IncognitonClient } from '../api/incogniton.client';
import { BrowserProfile } from '../models/common.types';
import { logger } from '../utils/logger';

describe('IncognitonClient', () => {
  let client: IncognitonClient;

  beforeEach(() => {
    client = new IncognitonClient();
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

describe('IncognitonClient - Full Profile Lifecycle', () => {
  let client: IncognitonClient;
  let profileId: string;

  beforeEach(() => {
    client = new IncognitonClient();
  });

  afterEach(async () => {
    if (profileId) {
      try {
        await client.profile.delete(profileId);
      } catch (error) {
        logger.error('Failed to cleanup profile:', { error });
      }
    }
  });

  it('should add, launch, stop, and delete a profile', async () => {
    // Step 1: Add a profile
    const profileData = {
      profileData: {
        general_profile_information: {
          // profile_name: 'Test Profile',
          // profile_notes: 'Test Notes',
          // profile_group: 'Test Group',
          // profile_last_edited: new Date().toISOString(),
          // simulated_operating_system: 'Windows',
          // profile_browser_version: '120',
        },
      },
    };

    const addResponse = await client.profile.add(profileData);
    logger.info('[Test] Step 1 - Profile Creation - Response:', { addResponse });
    expect(addResponse.status).toBe('ok');
    expect(typeof addResponse.profile_browser_id).toBe('string');

    profileId = addResponse.profile_browser_id ?? '';

    // Step 2: Launch Puppeteer with the profile ID
    const launchResponse = await client.automation.launchPuppeteer(profileId);
    logger.info('[Test] Step 2 - Browser Launch - Response:', { launchResponse });
    expect(launchResponse.status).toBe('ok');

    // Step 3: Stop the profile
    const stopResponse = await client.profile.stop(profileId);
    logger.info('[Test] Step 3 - Profile Stop - Response:', { stopResponse });
    expect(stopResponse.status).toBe('ok');
    expect(stopResponse.message).toBe('Profile stopped');

    // Step 4: Delete the profile
    const deleteResponse = await client.profile.delete(profileId);
    logger.info('[Test] Step 4 - Profile Deletion - Response:', { deleteResponse });
    expect(deleteResponse.status).toBe('ok');
    expect(deleteResponse.message).toBe('profile removed');

    // Clear profileId after successful deletion
    profileId = '';
  }, 30000); // Increase timeout to 30 seconds for real API calls
});
