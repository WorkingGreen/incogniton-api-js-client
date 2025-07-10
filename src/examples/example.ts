import { IncognitonClient } from '../api/incogniton.client.js';
import { logger } from '../utils/logger.js';

async function runExamples() {
  const client = new IncognitonClient();

  try {
    // Example 1: List all profiles
    logger.info('Fetching all profiles...');
    const profiles = await client.profile.list();
    logger.info('Profiles:', profiles);

    // Example 2: Get a specific profile by ID
    const profileId = 'example-profile-id';
    logger.info(`Fetching profile with ID: ${profileId}`);
    const profile = await client.profile.get(profileId);
    logger.info('Profile details:', profile);

    // Example 3: Add a new profile
    const newProfileData = {
      profileData: {
        general_profile_information: {
          profile_name: 'Example Profile',
          profile_notes: 'Created via example script',
          profile_group: 'Example Group',
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
          behavior: 'Masked' as 'Masked' | 'Altered' | 'Real',
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
    logger.info('Adding a new profile...');
    const newProfile = await client.profile.add(newProfileData);
    logger.info('New profile added:', newProfile);

    // Example 4: Launch a profile (Puppeteer)
    // const browser = await incognitonBrowser.startPuppeteer(profileId);
    // Example 4: Launch a profile (Playwright)
    // const browser = await incognitonBrowser.startPlaywright(profileId);
    // logger.info('Browser launched:', browser);
    
  } catch (error) {
    logger.error('An error occurred while running examples:', error);
  }
}

runExamples();
