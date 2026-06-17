#!/usr/bin/env node
/**
 * Smoke test for V5's Public REST Automation API (see AutomationRestService.java).
 *
 * Hits every endpoint reachable without external infrastructure. Endpoints that
 * spawn Chrome, kill the app, or need a real Selenium grid are skipped by default
 * with a clear explanation - flags below opt in.
 *
 * USAGE
 *     node automation-api-smoke-test.mjs                       # safe defaults
 *     node automation-api-smoke-test.mjs --profile-id <id>     # exercise launch/stop/cookies on a real profile
 *     node automation-api-smoke-test.mjs --destructive         # create/clone/delete a test profile (server-side)
 *     node automation-api-smoke-test.mjs --launch              # actually starts + stops Chrome (needs --profile-id)
 *     node automation-api-smoke-test.mjs --puppeteer           # actually starts a Puppeteer session (needs --profile-id)
 *     node automation-api-smoke-test.mjs --selenium            # actually starts a Selenium session via /automation/launch/python (needs --profile-id)
 *     node automation-api-smoke-test.mjs --cookie-roundtrip    # export -> delete -> re-import cookies on a real profile (needs --profile-id)
 *     node automation-api-smoke-test.mjs --close-at-end        # invokes /incogniton/close at the very end (will exit V5!)
 *
 * No dependencies - uses Node's built-in global fetch. Tested on Node 18+.
 */

const DEFAULT_BASE_URL = 'http://127.0.0.1:35000';
const TIMEOUT_MS = 30_000;

// ─── Coloured output ──────────────────────────────────────────────────────────

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const GRAY = '\x1b[90m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function supportsColour() {
  return Boolean(process.stdout.isTTY);
}

function c(colour, text) {
  return supportsColour() ? `${colour}${text}${RESET}` : text;
}

// ─── Result tracking ──────────────────────────────────────────────────────────

class Suite {
  constructor() {
    this.results = [];
  }

  add(r) {
    this.results.push(r);
    let colour;
    let sym;
    if (r.status === 'pass') {
      colour = GREEN;
      sym = 'PASS';
    } else if (r.status === 'skip') {
      colour = GRAY;
      sym = 'SKIP';
    } else {
      colour = RED;
      sym = 'FAIL';
    }
    const ms = `${Math.round(r.durationMs)}`.padStart(6);
    let line = `  [${c(colour, sym)}] ${r.name.padEnd(54)} ${c(GRAY, `${ms}ms`)}`;
    if (r.detail) {
      line += `  ${c(GRAY, `- ${r.detail}`)}`;
    }
    console.log(line);
  }

  summary() {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;
    const total = this.results.length;
    console.log();
    console.log(c(BOLD, '-'.repeat(70)));
    console.log(
      `  ${c(GREEN, `${passed} passed`)}, ` +
        `${failed ? c(RED, `${failed} failed`) : '0 failed'}, ` +
        `${c(GRAY, `${skipped} skipped`)}  (${total} total)`
    );
    return failed === 0 ? 0 : 1;
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

/**
 * Make an HTTP request. Returns { status, body }.
 * body is an object if the response is JSON, otherwise the raw string.
 * Throws on transport failure.
 */
async function request(method, url, { form, rawJson } = {}) {
  let body;
  const headers = {};
  if (form !== undefined) {
    body = new URLSearchParams(form).toString();
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  } else if (rawJson !== undefined) {
    body = JSON.stringify(rawJson);
    headers['Content-Type'] = 'application/json';
  }
  const resp = await fetch(url, { method, headers, body, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const text = await resp.text();
  try {
    return { status: resp.status, body: JSON.parse(text) };
  } catch {
    return { status: resp.status, body: text };
  }
}

/** Run a single test, append to suite, return its [passed, detail]. */
async function run(suite, name, fn) {
  const start = performance.now();
  let passed;
  let detail;
  let status;
  try {
    [passed, detail] = await fn();
    status = passed ? 'pass' : 'fail';
  } catch (e) {
    passed = false;
    detail = `exception: ${e instanceof Error ? e.message : e}`;
    status = 'fail';
  }
  const durationMs = performance.now() - start;
  suite.add({ name, status, detail: detail ?? '', durationMs });
  return [passed, detail];
}

function skip(suite, name, reason) {
  suite.add({ name, status: 'skip', detail: reason, durationMs: 0 });
}

// ─── Assertion helpers ────────────────────────────────────────────────────────

function assertStatus(body, expected) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return [false, `expected object, got ${Array.isArray(body) ? 'array' : typeof body}`];
  }
  const actual = body.status;
  if (actual !== expected) {
    return [false, `status=${JSON.stringify(actual)} (wanted ${JSON.stringify(expected)}); body=${JSON.stringify(body)}`];
  }
  return [true, ''];
}

// ─── Test sections ────────────────────────────────────────────────────────────

async function testAlive(suite, base) {
  await run(suite, 'GET /alive returns "OK"', async () => {
    const { status, body } = await request('GET', `${base}/alive`);
    if (status !== 200) return [false, `http ${status}`];
    if (body !== 'OK') return [false, `body=${JSON.stringify(body)}`];
    return [true, ''];
  });
}

async function testErrorPaths(suite, base) {
  // Tests that exercise the validation/not-found code paths. Safe on any V5.
  console.log(c(BOLD, '\n  Error-path tests (no real profile required)'));

  const runUnknownGet = (path, expectedMsg) => async () => {
    const { body } = await request('GET', `${base}${path}`);
    const [ok, why] = assertStatus(body, 'error');
    if (!ok) return [false, why];
    if (expectedMsg && body.message !== expectedMsg) {
      return [false, `message=${JSON.stringify(body.message)} (wanted ${JSON.stringify(expectedMsg)})`];
    }
    return [true, ''];
  };

  await run(suite, 'GET /profile/get/<missing> returns error',
    runUnknownGet('/profile/get/__missing__', 'No profile found with that browser id.'));
  await run(suite, 'GET /profile/status/<missing> returns error',
    runUnknownGet('/profile/status/__missing__', 'No profile found with that browser id.'));
  await run(suite, 'GET /profile/delete/<missing> returns error',
    runUnknownGet('/profile/delete/__missing__', 'No profile found with that browser id.'));
  await run(suite, 'GET /profile/launch/<missing> returns error',
    runUnknownGet('/profile/launch/__missing__', 'No profile found with that browser id.'));
  await run(suite, 'GET /profile/dryLaunch/<missing> returns error',
    runUnknownGet('/profile/dryLaunch/__missing__', 'No profile found with that browser id.'));
  await run(suite, 'GET /profile/stop/<missing> returns error',
    runUnknownGet('/profile/stop/__missing__', 'No profile found with that browser id.'));
  await run(suite, 'GET /profile/cookie/<missing> returns error',
    runUnknownGet('/profile/cookie/__missing__', 'Invalid profile ID'));
  await run(suite, 'GET /profile/deleteCookie/<missing> returns error',
    runUnknownGet('/profile/deleteCookie/__missing__', 'Invalid profile ID'));
  await run(suite, 'GET /profile/clone/<missing> returns error',
    runUnknownGet('/profile/clone/__missing__', 'No profile found with that browser id.'));
  await run(suite, 'GET /automation/launch/puppeteer/<missing> returns error',
    runUnknownGet('/automation/launch/puppeteer/__missing__', "Profile doesn't exist"));
  await run(suite, 'GET /automation/launch/python/<missing> returns error',
    runUnknownGet('/automation/launch/python/__missing__', "Profile doesn't exist"));
  await run(suite, 'GET /automation/cookieRobot/<missing> returns error',
    runUnknownGet('/automation/cookieRobot/__missing__', "Profile doesn't exist"));

  await run(suite, 'POST /profile/update with no id returns error', async () => {
    const { body } = await request('POST', `${base}/profile/update`, { form: { profileData: JSON.stringify({}) } });
    const [ok, why] = assertStatus(body, 'error');
    if (!ok) return [false, why];
    if (body.message !== 'profile_browser_id is missing') {
      return [false, `message=${JSON.stringify(body.message)}`];
    }
    return [true, ''];
  });

  await run(suite, 'POST /profile/addCookie with no fields returns error', async () => {
    const { body } = await request('POST', `${base}/profile/addCookie`, { form: {} });
    const [ok, why] = assertStatus(body, 'error');
    if (!ok) return [false, why];
    const msg = body.message ?? '';
    for (const fragment of ['Profile_browser_id is missing', 'Format is missing', 'CookieData is missing']) {
      if (!msg.includes(fragment)) {
        return [false, `missing fragment ${JSON.stringify(fragment)} in ${JSON.stringify(msg)}`];
      }
    }
    return [true, ''];
  });

  await run(suite, 'POST /profile/addCookie with bad format returns error', async () => {
    const { body } = await request('POST', `${base}/profile/addCookie`, {
      form: { profile_browser_id: 'x', format: 'garbage', cookie: '[]' },
    });
    const [ok, why] = assertStatus(body, 'error');
    if (!ok) return [false, why];
    if (!(body.message ?? '').includes('Format is not spelled correctly')) {
      return [false, `message=${JSON.stringify(body.message)}`];
    }
    return [true, ''];
  });

  await run(suite, 'POST puppeteer launch with no profileID returns error', async () => {
    const { body } = await request('POST', `${base}/automation/launch/puppeteer/`, { form: {} });
    const [ok, why] = assertStatus(body, 'error');
    if (!ok) return [false, why];
    if (body.message !== 'No profile ID supplied') {
      return [false, `message=${JSON.stringify(body.message)}`];
    }
    return [true, ''];
  });
}

async function testReadOnly(suite, base, profileId) {
  // Tests that read state. Safe to run against any V5.
  console.log(c(BOLD, '\n  Read-only tests'));

  await run(suite, 'GET /profile/all/ returns ok + array', async () => {
    const { body } = await request('GET', `${base}/profile/all/`);
    const [ok, why] = assertStatus(body, 'ok');
    if (!ok) return [false, why];
    if (!('profileData' in body)) return [false, 'missing profileData'];
    if (!Array.isArray(body.profileData)) {
      return [false, `profileData is not a list: ${typeof body.profileData}`];
    }
    return [true, `${body.profileData.length} profiles`];
  });

  if (!profileId) {
    skip(suite, 'GET /profile/get/{id} on real profile', 'no --profile-id supplied');
    skip(suite, 'GET /profile/status/{id} on real profile', 'no --profile-id supplied');
    skip(suite, "GET /profile/cookie/{id} V4 'CookieData ' key check", 'no --profile-id supplied');
    return;
  }

  await run(suite, `GET /profile/get/${profileId} returns full profileData`, async () => {
    const { body } = await request('GET', `${base}/profile/get/${profileId}`);
    const [ok, why] = assertStatus(body, 'ok');
    if (!ok) return [false, why];
    if (!('profileData' in body)) return [false, 'missing profileData'];
    if (!('general_profile_information' in body.profileData)) {
      return [false, 'missing general_profile_information section'];
    }
    return [true, ''];
  });

  await run(suite, `GET /profile/status/${profileId} returns status display name`, async () => {
    const { body } = await request('GET', `${base}/profile/status/${profileId}`);
    // V4 quirk: the status field on the response holds the display name, not "ok"
    if (typeof body !== 'object' || body === null || !('status' in body)) {
      return [false, `no status field; body=${JSON.stringify(body)}`];
    }
    return [true, `status=${JSON.stringify(body.status)}`];
  });

  await run(suite, `GET /profile/cookie/${profileId} has 'CookieData ' (trailing space)`, async () => {
    const { body } = await request('GET', `${base}/profile/cookie/${profileId}`);
    const [ok, why] = assertStatus(body, 'ok');
    if (!ok) return [false, why];
    // The trailing space in "CookieData " is V4 behavior we preserve. Regression test.
    if (!('CookieData ' in body)) {
      return [false, "missing 'CookieData ' key (note trailing space - V4 wire-format quirk we preserve)"];
    }
    return [true, `${body['CookieData '].length} cookies`];
  });
}

async function testDryLaunch(suite, base, profileId) {
  // Dry-launch builds the launch command without actually spawning Chrome - safe on a real profile.
  console.log(c(BOLD, '\n  Dry-launch tests'));
  if (!profileId) {
    skip(suite, 'GET /profile/dryLaunch/{id} on real profile', 'no --profile-id supplied');
    return;
  }

  await run(suite, `GET /profile/dryLaunch/${profileId} returns built command in 'arg'`, async () => {
    let { body } = await request('GET', `${base}/profile/dryLaunch/${profileId}`);
    // Same out-of-sync handling as launch: mutations from prior runs can leave the
    // profile flagged out-of-sync, in which case V5 returns force-link hints.
    if (body.status === 'error' && String(body.message ?? '').includes('out of sync')) {
      ({ body } = await request('GET', `${base}/profile/dryLaunch/${profileId}/force/local`));
    }
    const [ok, why] = assertStatus(body, 'ok');
    if (!ok) return [false, why];
    if (!('arg' in body)) return [false, "missing 'arg' (built launch command)"];
    return [true, `command length: ${body.arg.length}`];
  });
}

async function testDestructive(suite, base) {
  // Creates a profile, clones it, then deletes both. Touches the user's server-side data.
  console.log(c(BOLD, '\n  Destructive create/clone/delete tests'));

  // Build a minimal profile payload - only the bits the server requires.
  const payload = {
    general_profile_information: {
      profile_name: `smoke-test-${Math.floor(Date.now() / 1000)}`,
      profile_group: 'Unassigned',
    },
  };

  let createdId = null;
  let clonedId = null;
  let getClonedId = null;

  await run(suite, 'POST /profile/add creates a profile', async () => {
    const { body } = await request('POST', `${base}/profile/add`, { form: { profileData: JSON.stringify(payload) } });
    const [ok, why] = assertStatus(body, 'ok');
    if (!ok) return [false, why];
    if (!('profile_browser_id' in body)) return [false, 'missing profile_browser_id'];
    createdId = body.profile_browser_id;
    return [true, `id=${createdId}`];
  });

  if (!createdId) {
    skip(suite, 'POST /profile/clone the just-created profile', 'create failed');
    skip(suite, 'GET /profile/clone/{id} the just-created profile (all-true defaults)', 'create failed');
    skip(suite, 'GET /profile/delete/<post-clone>', 'clone failed');
    skip(suite, 'GET /profile/delete/<get-clone>', 'clone failed');
    skip(suite, 'GET /profile/delete/<created>', 'create failed');
    return;
  }

  await run(suite, 'POST /profile/clone creates a clone', async () => {
    const clonePayload = {
      profile_browser_id: createdId,
      profile_name: `smoke-clone-${Math.floor(Date.now() / 1000)}`,
    };
    const { body } = await request('POST', `${base}/profile/clone`, {
      form: { profileCloneData: JSON.stringify(clonePayload) },
    });
    const [ok, why] = assertStatus(body, 'ok');
    if (!ok) return [false, why];
    if (!('profile_browser_id' in body)) return [false, 'missing profile_browser_id'];
    clonedId = body.profile_browser_id;
    return [true, `id=${clonedId}`];
  });

  await run(suite, `GET /profile/clone/${createdId} clones with all-true defaults`, async () => {
    // GET form uses V4's all-true defaults: same name, same group, all flags true.
    const { body } = await request('GET', `${base}/profile/clone/${createdId}`);
    const [ok, why] = assertStatus(body, 'ok');
    if (!ok) return [false, why];
    if (!('profile_browser_id' in body)) return [false, 'missing profile_browser_id'];
    getClonedId = body.profile_browser_id;
    if (getClonedId === createdId) {
      return [false, 'clone returned the source id (no new profile created)'];
    }
    return [true, `id=${getClonedId}`];
  });

  if (clonedId) {
    await run(suite, `GET /profile/delete/${clonedId} (the POST clone)`, async () => {
      const { body } = await request('GET', `${base}/profile/delete/${clonedId}`);
      return assertStatus(body, 'ok');
    });
  }

  if (getClonedId) {
    await run(suite, `GET /profile/delete/${getClonedId} (the GET clone)`, async () => {
      const { body } = await request('GET', `${base}/profile/delete/${getClonedId}`);
      return assertStatus(body, 'ok');
    });
  }

  await run(suite, `GET /profile/delete/${createdId} (the original)`, async () => {
    const { body } = await request('GET', `${base}/profile/delete/${createdId}`);
    return assertStatus(body, 'ok');
  });
}

async function testLaunchStop(suite, base, profileId) {
  // Actually spawns Chrome (twice). Only runs with --launch + --profile-id.
  // Cycle 1: launch + graceful stop. Cycle 2: launch + force-stop.
  console.log(c(BOLD, '\n  Live launch + stop tests (Chrome will open!)'));
  if (!profileId) {
    skip(suite, 'GET /profile/launch/{id}', 'needs --profile-id');
    skip(suite, 'GET /profile/stop/{id}', 'needs --profile-id');
    skip(suite, 'GET /profile/force-stop/{id}', 'needs --profile-id');
    return;
  }

  const launchOnce = async () => {
    let { body } = await request('GET', `${base}/profile/launch/${profileId}`);
    // On out-of-sync, V5 returns localForceLink/cloudForceLink and expects the client
    // to retry with one of them. Mirror that behavior so the test actually exercises the
    // launch path rather than reporting a fake fail on the first attempt.
    if (body.status === 'error' && String(body.message ?? '').includes('out of sync')) {
      ({ body } = await request('GET', `${base}/profile/launch/${profileId}/force/local`));
    }
    return body;
  };

  // Cycle 1: graceful stop
  const [launched1] = await run(suite, `GET /profile/launch/${profileId} starts Chrome (cycle 1)`, async () => {
    const body = await launchOnce();
    const [ok, why] = assertStatus(body, 'ok');
    if (!ok) return [false, why];
    return [true, body.message ?? ''];
  });

  if (launched1) {
    await sleep(3000);
    await run(suite, `GET /profile/stop/${profileId} closes Chrome`, async () => {
      const { body } = await request('GET', `${base}/profile/stop/${profileId}`);
      return assertStatus(body, 'ok');
    });
  } else {
    skip(suite, `GET /profile/stop/${profileId}`, 'launch cycle 1 failed');
  }

  // Cycle 2: force-stop. Brief pause so the previous stop fully settles.
  await sleep(2000);
  const [launched2] = await run(suite, `GET /profile/launch/${profileId} starts Chrome (cycle 2)`, async () => {
    const body = await launchOnce();
    const [ok, why] = assertStatus(body, 'ok');
    if (!ok) return [false, why];
    return [true, body.message ?? ''];
  });

  if (!launched2) {
    skip(suite, `GET /profile/force-stop/${profileId}`, 'launch cycle 2 failed');
    return;
  }
  await sleep(3000);

  await run(suite, `GET /profile/force-stop/${profileId} closes Chrome (status -> READY)`, async () => {
    const { body } = await request('GET', `${base}/profile/force-stop/${profileId}`);
    const [ok, why] = assertStatus(body, 'ok');
    if (!ok) return [false, why];
    // V4 wire-format check: force-stop returns the distinct message string.
    if (body.message !== 'Profile force stopped') {
      return [false, `message=${JSON.stringify(body.message)} (wanted 'Profile force stopped')`];
    }
    return [true, ''];
  });
}

async function testPuppeteer(suite, base, profileId) {
  // Spawns Chrome with --remote-debugging-port. Only runs with --puppeteer + --profile-id.
  // Exercises both the GET path (id in URL) and the POST path (profileID in form body).
  console.log(c(BOLD, '\n  Live Puppeteer launch test'));
  if (!profileId) {
    skip(suite, 'GET /automation/launch/puppeteer/{id}', 'needs --profile-id');
    skip(suite, 'POST /automation/launch/puppeteer/', 'needs --profile-id');
    return;
  }

  const [launched] = await run(suite, `GET puppeteer launch on ${profileId}`, async () => {
    const { body } = await request('GET', `${base}/automation/launch/puppeteer/${profileId}`);
    const [ok, why] = assertStatus(body, 'ok');
    if (!ok) return [false, why];
    if (!('puppeteerUrl' in body)) return [false, 'missing puppeteerUrl'];
    return [true, body.puppeteerUrl];
  });

  if (launched) {
    await sleep(3000);
    await run(suite, 'GET /profile/stop/{id} (clean up GET puppeteer browser)', async () => {
      const { body } = await request('GET', `${base}/profile/stop/${profileId}`);
      return assertStatus(body, 'ok');
    });
    await sleep(2000);
  }

  const [posted] = await run(suite, 'POST /automation/launch/puppeteer/ (body form)', async () => {
    const { body } = await request('POST', `${base}/automation/launch/puppeteer/`, { form: { profileID: profileId } });
    const [ok, why] = assertStatus(body, 'ok');
    if (!ok) return [false, why];
    if (!('puppeteerUrl' in body)) return [false, 'missing puppeteerUrl'];
    return [true, body.puppeteerUrl];
  });

  if (posted) {
    await sleep(3000);
    await run(suite, 'GET /profile/stop/{id} (clean up POST puppeteer browser)', async () => {
      const { body } = await request('GET', `${base}/profile/stop/${profileId}`);
      return assertStatus(body, 'ok');
    });
  }
}

async function testSelenium(suite, base, profileId) {
  // Spawns Chrome via the Selenium grid. Only runs with --selenium + --profile-id.
  // Needs selenium-server.jar present (downloaded lazily on first V5 boot).
  //
  // Two known server-side issues surface here (slow grid teardown + ready-check race
  // on back-to-back launches). Both tracked in docs/REST_AUTOMATION_KNOWN_ISSUES.md.
  console.log(c(BOLD, '\n  Live Selenium launch test'));
  if (!profileId) {
    skip(suite, 'GET /automation/launch/python/{id}', 'needs --profile-id');
    skip(suite, 'POST /automation/launch/python/', 'needs --profile-id');
    return;
  }

  const assertSeleniumResponse = body => {
    const [ok, why] = assertStatus(body, 'ok');
    if (!ok) return [false, why];
    if (!('url' in body)) return [false, `missing 'url'; got keys ${JSON.stringify(Object.keys(body))}`];
    return [true, body.url];
  };

  const [launched] = await run(suite, `GET selenium launch on ${profileId}`, async () => {
    const { body } = await request('GET', `${base}/automation/launch/python/${profileId}`);
    return assertSeleniumResponse(body);
  });

  if (launched) {
    await sleep(3000);
    await run(suite, 'GET /profile/force-stop/{id} (clean up GET selenium browser)', async () => {
      const { body } = await request('GET', `${base}/profile/force-stop/${profileId}`);
      return assertStatus(body, 'ok');
    });
    await sleep(2000);
  }

  const [posted] = await run(suite, 'POST /automation/launch/python/ (body form)', async () => {
    const { body } = await request('POST', `${base}/automation/launch/python/`, { form: { profileID: profileId } });
    return assertSeleniumResponse(body);
  });

  if (posted) {
    await sleep(3000);
    await run(suite, 'GET /profile/force-stop/{id} (clean up POST selenium browser)', async () => {
      const { body } = await request('GET', `${base}/profile/force-stop/${profileId}`);
      return assertStatus(body, 'ok');
    });
  }
}

async function testCookieRoundtrip(suite, base, profileId) {
  // End-to-end cookie test against a real profile:
  //   1. Export current cookies (GET /profile/cookie/{id}).
  //   2. Drop one entry to form a 'subset' (skipped if the profile has 0 cookies).
  //   3. Delete all cookies (GET /profile/deleteCookie/{id}).
  //   4. Verify the export now shows 0 cookies.
  //   5. Re-import the subset (POST /profile/addCookie, format=json).
  //   6. Verify the export now shows subset.length cookies.
  //   7. Best-effort restore: delete + re-import the original full set so we leave the profile as we found it.
  console.log(c(BOLD, '\n  Cookie roundtrip (export -> delete -> import) - MUTATES profile cookies'));
  if (!profileId) {
    skip(suite, 'cookie export/delete/import roundtrip', 'needs --profile-id');
    return;
  }

  let original = [];

  const [exportedOk] = await run(suite, 'export original cookies', async () => {
    const { body } = await request('GET', `${base}/profile/cookie/${profileId}`);
    const [ok, why] = assertStatus(body, 'ok');
    if (!ok) return [false, why];
    const cookies = body['CookieData '] ?? [];
    if (!Array.isArray(cookies)) return [false, `'CookieData ' is not a list: ${typeof cookies}`];
    original = cookies;
    return [true, `${original.length} cookies exported`];
  });
  if (!exportedOk) {
    skip(suite, 'cookie roundtrip: delete + import + verify', 'initial export failed');
    return;
  }

  if (original.length === 0) {
    skip(suite, 'cookie roundtrip: delete + import + verify',
      'profile has 0 cookies - launch it once and visit a site first');
    return;
  }

  // Drop one cookie if we have >=2; otherwise re-import the lone original.
  const subset = original.length >= 2 ? original.slice(0, -1) : [...original];

  await run(suite, `delete all cookies (was ${original.length})`, async () => {
    const { body } = await request('GET', `${base}/profile/deleteCookie/${profileId}`);
    return assertStatus(body, 'ok');
  });

  await run(suite, 'post-delete export shows 0 cookies', async () => {
    const { body } = await request('GET', `${base}/profile/cookie/${profileId}`);
    const [ok, why] = assertStatus(body, 'ok');
    if (!ok) return [false, why];
    const cookies = body['CookieData '] ?? [];
    if (cookies.length) return [false, `expected 0 cookies after delete, got ${cookies.length}`];
    return [true, '0 cookies'];
  });

  const [importedOk] = await run(suite, `import subset (${subset.length} of ${original.length} cookies)`, async () => {
    const { body } = await request('POST', `${base}/profile/addCookie`, {
      form: { profile_browser_id: profileId, format: 'json', cookie: JSON.stringify(subset) },
    });
    return assertStatus(body, 'ok');
  });

  if (importedOk) {
    await run(suite, 'post-import export shows subset count', async () => {
      const { body } = await request('GET', `${base}/profile/cookie/${profileId}`);
      const [ok, why] = assertStatus(body, 'ok');
      if (!ok) return [false, why];
      const cookies = body['CookieData '] ?? [];
      if (cookies.length !== subset.length) {
        return [false, `expected ${subset.length} cookies, got ${cookies.length}`];
      }
      return [true, `${cookies.length} cookies`];
    });
  }

  // Best-effort restore: wipe + re-import the original full set.
  await run(suite, 'restore original cookies (cleanup)', async () => {
    await request('GET', `${base}/profile/deleteCookie/${profileId}`);
    const { body } = await request('POST', `${base}/profile/addCookie`, {
      form: { profile_browser_id: profileId, format: 'json', cookie: JSON.stringify(original) },
    });
    return assertStatus(body, 'ok');
  });
}

async function testClose(suite, base) {
  // Kills the app. Always last, opt-in only.
  console.log(c(BOLD, '\n  Close test (V5 will exit!)'));

  await run(suite, 'GET /incogniton/close returns ok and triggers shutdown', async () => {
    const { body } = await request('GET', `${base}/incogniton/close`);
    const [ok, why] = assertStatus(body, 'ok');
    if (!ok) return [false, why];
    if (body.message !== 'Closing') return [false, `message=${JSON.stringify(body.message)}`];
    return [true, ''];
  });
}

// ─── Always-skipped endpoints (with explanations) ─────────────────────────────

function listSkipped(suite) {
  // Print which endpoints we deliberately don't test, and why.
  console.log(c(BOLD, '\n  Always-skipped endpoints'));
  const skipped = [
    ['POST /profile/add', 'in --destructive only - creates a real server-side profile'],
    ['POST /profile/update', 'needs a known profile to mutate; the round-trip uses create+update; the contract is locked by tests in RestProfileUpdateTest'],
    ['POST /profile/addCookie (happy path)', 'use --cookie-roundtrip (with --profile-id) - mutates real cookies'],
    ['GET /profile/deleteCookie/{id} (happy path)', 'use --cookie-roundtrip (with --profile-id) - mutates real cookies'],
    ['Selenium launch (happy path) /automation/launch/python/{id} + POST', 'use --selenium (with --profile-id) - spawns Chrome via Selenium grid'],
    ['Cookie robot /automation/cookieRobot/{id}', 'spawns Chrome, crawls top-50 sites for 120s, modifies cookies on the profile'],
    ['Puppeteer launch (happy path) GET + POST', 'use --puppeteer (with --profile-id) - actually spawns Chrome'],
    ['/incogniton/close', 'use --close-at-end - terminates V5'],
  ];
  for (const [name, reason] of skipped) {
    skip(suite, name, reason);
  }
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function printHelp() {
  // Mirror the module docstring at the top of this file.
  const doc = `
Smoke test for V5's Public REST Automation API.

USAGE
    node automation-api-smoke-test.mjs                       # safe defaults
    node automation-api-smoke-test.mjs --profile-id <id>     # exercise launch/stop/cookies on a real profile
    node automation-api-smoke-test.mjs --destructive         # create/clone/delete a test profile (server-side)
    node automation-api-smoke-test.mjs --launch              # actually starts + stops Chrome (needs --profile-id)
    node automation-api-smoke-test.mjs --puppeteer           # actually starts a Puppeteer session (needs --profile-id)
    node automation-api-smoke-test.mjs --selenium            # actually starts a Selenium session (needs --profile-id)
    node automation-api-smoke-test.mjs --cookie-roundtrip    # export -> delete -> re-import cookies (needs --profile-id)
    node automation-api-smoke-test.mjs --close-at-end        # invokes /incogniton/close at the very end (will exit V5!)

OPTIONS
    --base-url <url>     V5 automation API base URL (default: ${DEFAULT_BASE_URL})
    --profile-id <id>    A known browser_id to exercise read / launch / stop / cookies endpoints against
    --destructive        Run create / clone / delete tests (touches the user's server-side data)
    --launch             Actually start + stop Chrome for the given --profile-id
    --puppeteer          Actually start a Puppeteer session and stop it (covers GET + POST)
    --selenium           Actually start a Selenium grid session and stop it (covers GET + POST; needs selenium-server.jar)
    --cookie-roundtrip   Export -> delete -> re-import cookies on the given --profile-id (restored at the end)
    --close-at-end       Invoke /incogniton/close at the very end (will terminate V5!)
    -h, --help           Show this help
`;
  console.log(doc.trimStart());
}

function parseArgs(argv) {
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    profileId: null,
    destructive: false,
    launch: false,
    puppeteer: false,
    selenium: false,
    cookieRoundtrip: false,
    closeAtEnd: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--base-url': args.baseUrl = argv[++i]; break;
      case '--profile-id': args.profileId = argv[++i]; break;
      case '--destructive': args.destructive = true; break;
      case '--launch': args.launch = true; break;
      case '--puppeteer': args.puppeteer = true; break;
      case '--selenium': args.selenium = true; break;
      case '--cookie-roundtrip': args.cookieRoundtrip = true; break;
      case '--close-at-end': args.closeAtEnd = true; break;
      case '-h':
      case '--help': printHelp(); process.exit(0); break;
      default:
        console.error(`Unknown argument: ${a} (try --help)`);
        process.exit(2);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const suite = new Suite();
  console.log(c(BOLD, `\nSmoke test against ${args.baseUrl}`));

  // Connectivity probe first - everything else assumes the server is up.
  try {
    await request('GET', `${args.baseUrl}/alive`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(c(RED, `\n  [FAIL] Cannot reach ${args.baseUrl}/alive - is V5 running with the automation API enabled? (${msg})`));
    return 2;
  }

  await testAlive(suite, args.baseUrl);
  await testErrorPaths(suite, args.baseUrl);
  await testReadOnly(suite, args.baseUrl, args.profileId);
  await testDryLaunch(suite, args.baseUrl, args.profileId);

  if (args.destructive) {
    await testDestructive(suite, args.baseUrl);
  } else {
    skip(suite, 'destructive create/clone/delete cycle', 'use --destructive to run');
  }

  if (args.launch) {
    await testLaunchStop(suite, args.baseUrl, args.profileId);
  } else {
    skip(suite, 'live launch + stop', 'use --launch (with --profile-id) to run');
  }

  if (args.puppeteer) {
    await testPuppeteer(suite, args.baseUrl, args.profileId);
  } else {
    skip(suite, 'live puppeteer launch', 'use --puppeteer (with --profile-id) to run');
  }

  if (args.selenium) {
    await testSelenium(suite, args.baseUrl, args.profileId);
  } else {
    skip(suite, 'live selenium launch', 'use --selenium (with --profile-id) to run');
  }

  if (args.cookieRoundtrip) {
    await testCookieRoundtrip(suite, args.baseUrl, args.profileId);
  } else {
    skip(suite, 'cookie export/delete/import roundtrip', 'use --cookie-roundtrip (with --profile-id) to run');
  }

  listSkipped(suite);

  if (args.closeAtEnd) {
    await testClose(suite, args.baseUrl);
  }

  return suite.summary();
}

main()
  .then(code => process.exit(code))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
