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

    it('clone() with no options sends just the source id', async () => {
      await client.profile.clone(ID);
      expect(lastCall().body).toEqual({ profile_browser_id: ID });
    });

    it('cloneQuick() hits GET /profile/clone/{id}', async () => {
      await client.profile.cloneQuick(ID);
      expect(lastCall()).toMatchObject({ method: 'GET', endpoint: `/profile/clone/${ID}` });
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
