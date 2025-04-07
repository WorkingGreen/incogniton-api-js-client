import { IncognitonClient } from '../api/incogniton.client';
import { defaults } from '../config/defaults';
import { CreateBrowserProfileRequest, AddCookieRequest } from '../models/common.types';

// Mock the HTTP agent
jest.mock('../utils/http/provider', () => ({
  InitHttpAgent: jest.fn().mockReturnValue({
    get: jest.fn().mockReturnThis(),
    post: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    setBody: jest.fn().mockReturnThis(),
    do: jest.fn().mockResolvedValue({ status: 'ok' }),
  }),
}));

describe('IncognitonClient', () => {
  let client: IncognitonClient;

  beforeEach(() => {
    client = new IncognitonClient();
  });

  describe('Profile Operations', () => {
    it('should list all profiles', async () => {
      const response = await client.profile.list();
      expect(response.status).toBe('ok');
    });

    it('should get a specific profile', async () => {
      const profileId = 'test-profile-id';
      const response = await client.profile.get(profileId);
      expect(response.status).toBe('ok');
    });

    it('should add a new profile', async () => {
      const profileData: CreateBrowserProfileRequest = {
        profileData: {
          general_profile_information: {
            profile_name: 'Test Profile',
            profile_notes: 'Test notes',
            profile_group: 'Test Group',
            profile_last_edited: new Date().toISOString(),
            simulated_operating_system: 'Windows',
            profile_browser_version: '120',
          },
          Proxy: {
            connection_type: 'HTTP',
            proxy_url: 'http://proxy.example.com:8080',
            proxy_username: 'user',
            proxy_password: 'pass',
            proxy_rotating: 1,
            proxy_provider: 'Test Provider',
          },
          Timezone: {
            fill_timezone_based_on_ip: true,
            timezone_name: 'UTC',
            timezone_offset: '0',
          },
          WebRTC: {
            set_external_ip: true,
            behavior: 'Altered',
            public_ip: '1.2.3.4',
            local_ip: '192.168.1.1',
          },
          Navigator: {
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            screen_resolution: '1920x1080',
            languages: 'en-US',
            platform: 'Win32',
            do_not_track: false,
            hardware_concurrency: 8,
          },
          Other: {
            active_session_lock: false,
            other_ShowProfileName: true,
            custom_browser_args_enabled: false,
            browser_language_lock: false,
            browser_allowRealMediaDevices: false,
          },
        },
      };

      const response = await client.profile.add(profileData);
      expect(response.status).toBe('ok');
    });

    it('should update a profile', async () => {
      const profileId = 'test-profile-id';
      const updateData = {
        profileData: {
          general_profile_information: {
            profile_name: 'Updated Profile',
            profile_notes: '',
            profile_group: '',
            profile_last_edited: '',
            simulated_operating_system: '',
            profile_browser_version: '',
          },
        },
      };

      const response = await client.profile.update(profileId, updateData);
      expect(response.status).toBe('ok');
    });

    it('should delete a profile', async () => {
      const profileId = 'test-profile-id';
      const response = await client.profile.delete(profileId);
      expect(response.status).toBe('ok');
    });

    it('should launch a profile', async () => {
      const profileId = 'test-profile-id';
      const response = await client.profile.launch(profileId);
      expect(response.status).toBe('ok');
    });

    it('should force local launch', async () => {
      const profileId = 'test-profile-id';
      const response = await client.profile.launchForceLocal(profileId);
      expect(response.status).toBe('ok');
    });

    it('should force cloud launch', async () => {
      const profileId = 'test-profile-id';
      const response = await client.profile.launchForceCloud(profileId);
      expect(response.status).toBe('ok');
    });
  });

  describe('Cookie Operations', () => {
    it('should get cookies for a profile', async () => {
      const profileId = 'test-profile-id';
      const response = await client.cookie.get(profileId);
      expect(response.status).toBe('ok');
    });

    it('should add a cookie to a profile', async () => {
      const profileId = 'test-profile-id';
      const cookieData: AddCookieRequest = {
        name: 'test_cookie',
        value: 'test_value',
        domain: '.example.com',
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'Lax',
        expires: Math.floor(Date.now() / 1000) + 86400, // 1 day from now in seconds
      };

      const response = await client.cookie.add(profileId, cookieData);
      expect(response.status).toBe('ok');
    });

    it('should delete cookies from a profile', async () => {
      const profileId = 'test-profile-id';
      const response = await client.cookie.delete(profileId);
      expect(response.status).toBe('ok');
    });
  });

  describe('Automation Operations', () => {
    it('should launch Puppeteer', async () => {
      const profileId = 'test-profile-id';
      const response = await client.automation.launchPuppeteer(profileId);
      expect(response.status).toBe('ok');
    });

    it('should launch Puppeteer with custom arguments', async () => {
      const profileId = 'test-profile-id';
      const customArgs = '--headless=new';
      const response = await client.automation.launchPuppeteerCustom(profileId, customArgs);
      expect(response.status).toBe('ok');
    });
  });
});
