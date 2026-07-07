/**
 * Unit tests for IncognitonClient request routing.
 *
 * These swap the client's internal HTTP agent for a recording fake (no live
 * Incogniton app required) and assert that each client method targets the
 * correct route, HTTP verb, and body — the wire contract against the V5
 * automation REST API (`rest-api-spec.json`).
 */
import { IncognitonClient } from '../api/incogniton.client.js';

interface RecordedCall {
  method: string;
  endpoint: string;
  body?: unknown;
  text: boolean;
}

const ID = 'test-browser-id';

describe('IncognitonClient routing', () => {
  let client: IncognitonClient;
  let calls: RecordedCall[];

  // A chainable fake mirroring the HttpAgentBuilder/RequestWrapper surface,
  // recording each call instead of hitting the network.
  function makeWrapper(method: string, endpoint: string) {
    const call: RecordedCall = { method, endpoint, body: undefined, text: false };
    const wrapper: any = {
      set: () => wrapper,
      setBody: (data: unknown) => {
        call.body = data;
        return wrapper;
      },
      toFormUrlEncoded: () => wrapper,
      asText: () => {
        call.text = true;
        return wrapper;
      },
      do: async () => {
        calls.push(call);
        // `/alive` is served as raw (quoted) text; everything else is JSON.
        return call.text ? '"OK"' : { status: 'ok' };
      },
    };
    return wrapper;
  }

  beforeEach(() => {
    calls = [];
    client = new IncognitonClient();
    // Replace the real HTTP agent with the recording fake.
    (client as any).httpAgent = {
      get: (endpoint: string) => makeWrapper('GET', endpoint),
      post: (endpoint: string) => makeWrapper('POST', endpoint),
      put: (endpoint: string) => makeWrapper('PUT', endpoint),
      delete: (endpoint: string) => makeWrapper('DELETE', endpoint),
      patch: (endpoint: string) => makeWrapper('PATCH', endpoint),
    };
  });

  const lastCall = () => calls[calls.length - 1];

  describe('constructor', () => {
    it('accepts an options object', () => {
      expect(new IncognitonClient({ port: 40000 })).toBeInstanceOf(IncognitonClient);
      expect(new IncognitonClient({ baseUrl: 'http://localhost:35000' })).toBeInstanceOf(
        IncognitonClient
      );
    });

    it('accepts the legacy positional signature', () => {
      expect(new IncognitonClient('http://localhost:35000', 30)).toBeInstanceOf(IncognitonClient);
    });
  });

  describe('system', () => {
    it('alive() hits GET /alive as text and normalizes the quoted "OK"', async () => {
      const result = await client.system.alive();
      expect(lastCall()).toMatchObject({ method: 'GET', endpoint: '/alive', text: true });
      expect(result).toBe('OK');
    });

    it('close() hits GET /incogniton/close', async () => {
      await client.system.close();
      expect(lastCall()).toMatchObject({ method: 'GET', endpoint: '/incogniton/close' });
    });
  });

  describe('profile', () => {
    it('list() hits GET /profile/all/ (trailing slash)', async () => {
      await client.profile.list();
      expect(lastCall()).toMatchObject({ method: 'GET', endpoint: '/profile/all/' });
    });

    it('get() hits GET /profile/get/{id}', async () => {
      await client.profile.get(ID);
      expect(lastCall()).toMatchObject({ method: 'GET', endpoint: `/profile/get/${ID}` });
    });

    it('add() POSTs /profile/add with the profile document stringified under profileData', async () => {
      const profileData = { general_profile_information: { profile_name: 'X' } };
      await client.profile.add({ profileData });
      expect(lastCall()).toMatchObject({
        method: 'POST',
        endpoint: '/profile/add',
        body: { profileData: JSON.stringify(profileData) },
      });
    });

    it('update() POSTs /profile/update, merging the id into the stringified document', async () => {
      const proxy = { connection_type: 'HTTP', proxy_url: 'host:1000' };
      await client.profile.update(ID, { profileData: { Proxy: proxy } });
      const call = lastCall();
      expect(call).toMatchObject({ method: 'POST', endpoint: '/profile/update' });
      expect(JSON.parse((call.body as { profileData: string }).profileData)).toEqual({
        profile_browser_id: ID,
        Proxy: proxy,
      });
    });

    it('switchProxy() routes through update() to POST /profile/update', async () => {
      const proxy = { connection_type: 'HTTP', proxy_url: 'host:1000' };
      await client.profile.switchProxy(ID, proxy);
      const call = lastCall();
      expect(call.endpoint).toBe('/profile/update');
      expect(JSON.parse((call.body as { profileData: string }).profileData)).toEqual({
        profile_browser_id: ID,
        Proxy: proxy,
      });
    });

    it('launch() and its force variants hit the right routes', async () => {
      await client.profile.launch(ID);
      expect(lastCall().endpoint).toBe(`/profile/launch/${ID}`);
      await client.profile.launchForceLocal(ID);
      expect(lastCall().endpoint).toBe(`/profile/launch/${ID}/force/local`);
      await client.profile.launchForceCloud(ID);
      expect(lastCall().endpoint).toBe(`/profile/launch/${ID}/force/cloud`);
    });

    it('getStatus() hits GET /profile/status/{id}', async () => {
      await client.profile.getStatus(ID);
      expect(lastCall()).toMatchObject({ method: 'GET', endpoint: `/profile/status/${ID}` });
    });

    it('stop() and forceStop() hit stop / force-stop', async () => {
      await client.profile.stop(ID);
      expect(lastCall()).toMatchObject({ method: 'GET', endpoint: `/profile/stop/${ID}` });
      await client.profile.forceStop(ID);
      expect(lastCall()).toMatchObject({ method: 'GET', endpoint: `/profile/force-stop/${ID}` });
    });

    it('delete() hits GET /profile/delete/{id}', async () => {
      await client.profile.delete(ID);
      expect(lastCall()).toMatchObject({ method: 'GET', endpoint: `/profile/delete/${ID}` });
    });
  });

  describe('cookie', () => {
    it('get() hits GET /profile/cookie/{id}', async () => {
      await client.cookie.get(ID);
      expect(lastCall()).toMatchObject({ method: 'GET', endpoint: `/profile/cookie/${ID}` });
    });

    it('add() POSTs /profile/addCookie with base64json-encoded cookie data', async () => {
      const cookies = [{ name: 'a', value: 'b', domain: '.example.com' }];
      await client.cookie.add(ID, cookies);
      const call = lastCall();
      expect(call).toMatchObject({ method: 'POST', endpoint: '/profile/addCookie' });
      const body = call.body as { profile_browser_id: string; format: string; cookie: string };
      expect(body.profile_browser_id).toBe(ID);
      expect(body.format).toBe('base64json');
      expect(Buffer.from(body.cookie, 'base64').toString()).toBe(JSON.stringify(cookies));
    });

    it('delete() hits GET /profile/deleteCookie/{id}', async () => {
      await client.cookie.delete(ID);
      expect(lastCall()).toMatchObject({ method: 'GET', endpoint: `/profile/deleteCookie/${ID}` });
    });
  });

  describe('control', () => {
    it('openUrl() POSTs /profile/openUrl/{id} with the url in the body', async () => {
      await client.control.openUrl(ID, 'https://example.com');
      expect(lastCall()).toMatchObject({
        method: 'POST',
        endpoint: `/profile/openUrl/${ID}`,
        body: { url: 'https://example.com' },
      });
    });

    it('navigate() POSTs /profile/navigate/{id} with the url in the body', async () => {
      await client.control.navigate(ID, 'https://example.com');
      expect(lastCall()).toMatchObject({
        method: 'POST',
        endpoint: `/profile/navigate/${ID}`,
        body: { url: 'https://example.com' },
      });
    });

    it('refresh() hits GET /profile/refresh/{id}', async () => {
      await client.control.refresh(ID);
      expect(lastCall()).toMatchObject({ method: 'GET', endpoint: `/profile/refresh/${ID}` });
    });

    it('tabs() hits GET /profile/tabs/{id}', async () => {
      await client.control.tabs(ID);
      expect(lastCall()).toMatchObject({ method: 'GET', endpoint: `/profile/tabs/${ID}` });
    });

    it('activateTab() POSTs /profile/activateTab/{id} with the targetId in the body', async () => {
      await client.control.activateTab(ID, 'tab-1');
      expect(lastCall()).toMatchObject({
        method: 'POST',
        endpoint: `/profile/activateTab/${ID}`,
        body: { targetId: 'tab-1' },
      });
    });

    it('closeTab() POSTs /profile/closeTab/{id} with the targetId in the body', async () => {
      await client.control.closeTab(ID, 'tab-1');
      expect(lastCall()).toMatchObject({
        method: 'POST',
        endpoint: `/profile/closeTab/${ID}`,
        body: { targetId: 'tab-1' },
      });
    });
  });

  describe('profile clone / dry-launch', () => {
    it('clone() POSTs /profile/clone with only the provided fields', async () => {
      await client.profile.clone(ID, { profileName: 'Clone A', cloneCookies: false });
      expect(lastCall()).toMatchObject({
        method: 'POST',
        endpoint: '/profile/clone',
        body: { profile_browser_id: ID, profile_name: 'Clone A', clone_cookies: false },
      });
      // Untouched flags must be omitted so the server applies its defaults.
      expect(lastCall().body).not.toHaveProperty('clone_useragent');
    });

    it('clone() with no options POSTs just the source id (all-defaults clone)', async () => {
      await client.profile.clone(ID);
      expect(lastCall()).toMatchObject({ method: 'POST', endpoint: '/profile/clone' });
      expect(lastCall().body).toEqual({ profile_browser_id: ID });
    });

    it('dryLaunch variants hit the right routes', async () => {
      await client.profile.dryLaunch(ID);
      expect(lastCall().endpoint).toBe(`/profile/dryLaunch/${ID}`);
      await client.profile.dryLaunchForceLocal(ID);
      expect(lastCall().endpoint).toBe(`/profile/dryLaunch/${ID}/force/local`);
      await client.profile.dryLaunchForceCloud(ID);
      expect(lastCall().endpoint).toBe(`/profile/dryLaunch/${ID}/force/cloud`);
    });
  });

  describe('automation', () => {
    it('launchPuppeteer() / launchSelenium() hit the GET launch routes', async () => {
      await client.automation.launchPuppeteer(ID);
      expect(lastCall()).toMatchObject({ method: 'GET', endpoint: `/automation/launch/puppeteer/${ID}` });
      await client.automation.launchSelenium(ID);
      expect(lastCall()).toMatchObject({ method: 'GET', endpoint: `/automation/launch/python/${ID}` });
    });

    it('launchPuppeteerCustom() POSTs /automation/launch/puppeteer/ with profileID + customArgs', async () => {
      await client.automation.launchPuppeteerCustom(ID, '--foo');
      expect(lastCall()).toMatchObject({
        method: 'POST',
        endpoint: '/automation/launch/puppeteer/',
        body: { profileID: ID, customArgs: '--foo' },
      });
    });

    it('launchSeleniumCustom() POSTs /automation/launch/python/{id}/ with customArgs', async () => {
      await client.automation.launchSeleniumCustom(ID, '--foo');
      expect(lastCall()).toMatchObject({
        method: 'POST',
        endpoint: `/automation/launch/python/${ID}/`,
        body: { customArgs: '--foo' },
      });
    });

    it('puppeteer force variants hit local/cloud routes', async () => {
      await client.automation.launchPuppeteerForceLocal(ID);
      expect(lastCall().endpoint).toBe(`/automation/launch/puppeteer/${ID}/local`);
      await client.automation.launchPuppeteerForceCloud(ID);
      expect(lastCall().endpoint).toBe(`/automation/launch/puppeteer/${ID}/cloud`);
    });

    it('selenium force variants hit local/cloud routes', async () => {
      await client.automation.launchSeleniumForceLocal(ID);
      expect(lastCall().endpoint).toBe(`/automation/launch/python/${ID}/local`);
      await client.automation.launchSeleniumForceCloud(ID);
      expect(lastCall().endpoint).toBe(`/automation/launch/python/${ID}/cloud`);
    });

    it('launchSeleniumCustomBody() POSTs /automation/launch/python/ with profileID in the body', async () => {
      await client.automation.launchSeleniumCustomBody(ID, {
        customArgs: '--foo',
        forceLocal: true,
      });
      expect(lastCall()).toMatchObject({
        method: 'POST',
        endpoint: '/automation/launch/python/',
        body: { profileID: ID, customArgs: '--foo', forceLocal: true },
      });
      expect(lastCall().body).not.toHaveProperty('forceCloud');
    });

    it('launchCookieRobot() hits GET /automation/cookieRobot/{id}', async () => {
      await client.automation.launchCookieRobot(ID);
      expect(lastCall()).toMatchObject({
        method: 'GET',
        endpoint: `/automation/cookieRobot/${ID}`,
      });
    });
  });
});
