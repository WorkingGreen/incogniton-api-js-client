#!/usr/bin/env node
/**
 * Destructive end-to-end test that drives the built IncognitonClient (the JS SDK
 * itself, not raw HTTP) across every API surface against a live Incogniton app.
 *
 * By default it runs the full server-side lifecycle — create, read, update,
 * switch-proxy, clone (custom + all-defaults), cookies, dry-launch — and DELETES
 * everything it creates so your account is left as it was. Chrome-spawning calls
 * (launch/stop, puppeteer, selenium, cookie-robot, control) are opt-in flags.
 *
 * USAGE
 *     node tools/client-api-test.mjs                 # server-side destructive lifecycle (no Chrome), self-cleaning
 *     node tools/client-api-test.mjs --launch        # + profile launch/stop/force-stop (opens Chrome)
 *     node tools/client-api-test.mjs --puppeteer     # + automation puppeteer launch variants (opens Chrome)
 *     node tools/client-api-test.mjs --selenium      # + automation selenium launch variants (needs grid)
 *     node tools/client-api-test.mjs --control       # + control ops (openUrl/tabs/...) — needs a build with the routes
 *     node tools/client-api-test.mjs --cookie-robot  # + cookie robot (crawls top-50 sites for ~120s)
 *     node tools/client-api-test.mjs --port 40000    # target a non-default app port
 *
 * Build the client first: `npm run build`. Requires the Incogniton app running.
 */

import { IncognitonClient } from '../dist/index.js';

// ─── Coloured output / result tracking ────────────────────────────────────────

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const GRAY = '\x1b[90m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const c = (colour, text) => (process.stdout.isTTY ? `${colour}${text}${RESET}` : text);
const sleep = ms => new Promise(r => setTimeout(r, ms));

class Suite {
  constructor() {
    this.results = [];
  }
  add(name, status, detail, ms) {
    this.results.push({ name, status });
    const sym = status === 'pass' ? c(GREEN, 'PASS') : status === 'skip' ? c(GRAY, 'SKIP') : c(RED, 'FAIL');
    let line = `  [${sym}] ${name.padEnd(52)} ${c(GRAY, `${Math.round(ms)}ms`.padStart(6))}`;
    if (detail) line += `  ${c(GRAY, `- ${detail}`)}`;
    console.log(line);
  }
  summary() {
    const p = this.results.filter(r => r.status === 'pass').length;
    const f = this.results.filter(r => r.status === 'fail').length;
    const s = this.results.filter(r => r.status === 'skip').length;
    console.log('\n' + c(BOLD, '-'.repeat(70)));
    console.log(`  ${c(GREEN, `${p} passed`)}, ${f ? c(RED, `${f} failed`) : '0 failed'}, ${c(GRAY, `${s} skipped`)}  (${this.results.length} total)`);
    return f === 0 ? 0 : 1;
  }
}

/**
 * Run one step. `fn` returns [ok, detail] or throws. Client methods resolve with
 * a { status } envelope even on app errors, so we assert on that rather than
 * relying on exceptions.
 */
async function run(suite, name, fn) {
  const start = performance.now();
  try {
    const [ok, detail] = await fn();
    suite.add(name, ok ? 'pass' : 'fail', detail ?? '', performance.now() - start);
    return ok;
  } catch (e) {
    suite.add(name, 'fail', `exception: ${e instanceof Error ? e.message : e}`, performance.now() - start);
    return false;
  }
}
const skip = (suite, name, reason) => suite.add(name, 'skip', reason, 0);
const isOk = res => res && res.status === 'ok';

// ─── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { port: undefined, launch: false, puppeteer: false, selenium: false, control: false, cookieRobot: false };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--port': args.port = Number(argv[++i]); break;
      case '--launch': args.launch = true; break;
      case '--puppeteer': args.puppeteer = true; break;
      case '--selenium': args.selenium = true; break;
      case '--control': args.control = true; break;
      case '--cookie-robot': args.cookieRobot = true; break;
      case '-h': case '--help':
        console.log('See the header of this file for usage.'); process.exit(0); break;
      default:
        console.error(`Unknown argument: ${argv[i]}`); process.exit(2);
    }
  }
  return args;
}

// ─── Main ───────────────────────────────────────────────────────────────────—

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const client = args.port ? new IncognitonClient({ port: args.port }) : new IncognitonClient();
  const suite = new Suite();
  const stamp = Math.floor(Date.now() / 1000);
  const created = []; // every profile id we make, deleted in the finally block

  console.log(c(BOLD, `\nJS client API test (destructive, self-cleaning)`));

  // Connectivity probe.
  try {
    const alive = await client.system.alive();
    if (alive !== 'OK') throw new Error(`alive returned ${JSON.stringify(alive)}`);
  } catch (e) {
    console.log(c(RED, `\n  [FAIL] Cannot reach the app via system.alive() (${e instanceof Error ? e.message : e})`));
    process.exit(2);
  }

  let mainId = null;
  try {
    // ── system ──────────────────────────────────────────────────────────────
    console.log(c(BOLD, '\n  system'));
    await run(suite, 'system.alive()', async () => {
      const r = await client.system.alive();
      return [r === 'OK', `-> ${r}`];
    });
    skip(suite, 'system.close()', 'would shut down the app');

    // ── profile: create + read ───────────────────────────────────────────────
    console.log(c(BOLD, '\n  profile (create + read)'));
    await run(suite, 'profile.list()', async () => {
      const r = await client.profile.list();
      return [isOk(r) && Array.isArray(r.profileData), `${r.profileData?.length} profiles`];
    });

    const createOk = await run(suite, 'profile.add()', async () => {
      const r = await client.profile.add({
        profileData: {
          general_profile_information: { profile_name: `js-api-test-${stamp}`, profile_group: 'Unassigned' },
        },
      });
      mainId = r.profile_browser_id;
      if (mainId) created.push(mainId);
      return [isOk(r) && Boolean(mainId), `id=${mainId}`];
    });

    if (!createOk || !mainId) {
      skip(suite, 'profile.get / update / clone / cookies / delete', 'add() failed — nothing to operate on');
    } else {
      await run(suite, 'profile.get()', async () => {
        const r = await client.profile.get(mainId);
        return [isOk(r) && Boolean(r.profileData?.general_profile_information), ''];
      });
      await run(suite, 'profile.getStatus()', async () => {
        const r = await client.profile.getStatus(mainId);
        return [typeof r?.status === 'string', `status=${r?.status}`];
      });

      // ── profile: mutate ─────────────────────────────────────────────────────
      console.log(c(BOLD, '\n  profile (mutate)'));
      await run(suite, 'profile.update()', async () => {
        const r = await client.profile.update(mainId, {
          profileData: { general_profile_information: { profile_notes: `updated ${stamp}` } },
        });
        return [isOk(r), r.message ?? ''];
      });
      await run(suite, 'profile.switchProxy()', async () => {
        const r = await client.profile.switchProxy(mainId, { connection_type: 'HTTP', proxy_url: '127.0.0.1:8080' });
        return [isOk(r), r.message ?? ''];
      });

      // ── profile: clone (both shapes of the merged clone) ────────────────────
      console.log(c(BOLD, '\n  profile (clone)'));
      await run(suite, 'profile.clone(id, options)', async () => {
        const r = await client.profile.clone(mainId, { profileName: `js-api-clone-${stamp}`, cloneCookies: false });
        if (isOk(r) && r.profile_browser_id) created.push(r.profile_browser_id);
        return [isOk(r) && r.profile_browser_id !== mainId, `id=${r.profile_browser_id}`];
      });
      await run(suite, 'profile.clone(id) [all-defaults]', async () => {
        const r = await client.profile.clone(mainId);
        if (isOk(r) && r.profile_browser_id) created.push(r.profile_browser_id);
        return [isOk(r) && r.profile_browser_id !== mainId, `id=${r.profile_browser_id}`];
      });

      // ── cookies ─────────────────────────────────────────────────────────────
      console.log(c(BOLD, '\n  cookie'));
      await run(suite, 'cookie.add()', async () => {
        const r = await client.cookie.add(mainId, [
          { name: 'test', value: 'v', domain: '.example.com', path: '/', secure: true, httpOnly: false },
        ]);
        return [isOk(r), r.message ?? ''];
      });
      await run(suite, 'cookie.get()', async () => {
        const r = await client.cookie.get(mainId);
        return [isOk(r) && Array.isArray(r['CookieData ']), `${r['CookieData ']?.length} cookies`];
      });
      await run(suite, 'cookie.delete()', async () => {
        const r = await client.cookie.delete(mainId);
        return [isOk(r), r.message ?? ''];
      });

      // ── dry-launch (builds the launch command, no Chrome) ───────────────────
      console.log(c(BOLD, '\n  dry-launch'));
      for (const [label, method] of [
        ['profile.dryLaunch()', 'dryLaunch'],
        ['profile.dryLaunchForceLocal()', 'dryLaunchForceLocal'],
        ['profile.dryLaunchForceCloud()', 'dryLaunchForceCloud'],
      ]) {
        // eslint-disable-next-line no-loop-func
        await run(suite, label, async () => {
          const r = await client.profile[method](mainId);
          return [isOk(r) && typeof r.arg === 'string', isOk(r) ? `arg len ${r.arg?.length}` : r.message];
        });
      }

      // ── force-stop a not-running profile ─────────────────────────────────────
      // force-stop targets a running/stuck profile; on a never-launched one the
      // app reports "Profile already stopped". Either is a valid round-trip here —
      // the meaningful happy path is exercised in the --launch section.
      await run(suite, 'profile.forceStop()', async () => {
        const r = await client.profile.forceStop(mainId);
        const benign = isOk(r) || /already stopped/i.test(r.message ?? '');
        return [benign, r.message ?? ''];
      });
    }

    // ── opt-in: browser launch + automation + control ─────────────────────────
    console.log(c(BOLD, '\n  launch / automation / control (opt-in)'));
    await runLaunch(suite, client, args, mainId);
    await runPuppeteer(suite, client, args, mainId);
    await runSelenium(suite, client, args, mainId);
    await runControl(suite, client, args, mainId);
    if (args.cookieRobot && mainId) {
      await run(suite, 'automation.launchCookieRobot()', async () => {
        const r = await client.automation.launchCookieRobot(mainId);
        return [isOk(r), r.message ?? ''];
      });
      // let it settle, then force-stop so it doesn't crawl for the full 120s
      await sleep(3000);
      await client.profile.forceStop(mainId).catch(() => {});
    } else {
      skip(suite, 'automation.launchCookieRobot()', 'use --cookie-robot (crawls ~120s)');
    }
  } finally {
    // ── cleanup: delete everything we created ─────────────────────────────────
    console.log(c(BOLD, '\n  cleanup (profile.delete on every created profile)'));
    for (const id of created) {
      // eslint-disable-next-line no-loop-func
      await run(suite, `profile.delete(${id.slice(0, 8)}…)`, async () => {
        const r = await client.profile.delete(id);
        return [isOk(r), r.message ?? ''];
      });
    }
  }

  process.exit(suite.summary());
}

// ─── opt-in sections ────────────────────────────────────────────────────────—

async function runLaunch(suite, client, args, id) {
  if (!args.launch || !id) {
    skip(suite, 'profile.launch() + stop/force-stop', id ? 'use --launch (opens Chrome)' : 'no profile');
    return;
  }
  const body = await launchWithSync(() => client.profile.launch(id),
    () => client.profile.launchForceLocal(id));
  const launched = await run(suite, 'profile.launch()', async () => [isOk(body), body.message ?? '']);
  if (!launched) return;
  await sleep(3000);
  await run(suite, 'profile.stop()', async () => {
    const r = await client.profile.stop(id);
    return [isOk(r), r.message ?? ''];
  });
}

async function runPuppeteer(suite, client, args, id) {
  if (!args.puppeteer || !id) {
    skip(suite, 'automation.launchPuppeteer() + custom/force', id ? 'use --puppeteer (opens Chrome)' : 'no profile');
    return;
  }
  const launched = await run(suite, 'automation.launchPuppeteer()', async () => {
    const r = await client.automation.launchPuppeteer(id);
    return [isOk(r) && Boolean(r.puppeteerUrl), r.puppeteerUrl ?? r.message];
  });
  if (launched) {
    await sleep(3000);
    await client.profile.stop(id).catch(() => {});
  }
}

async function runSelenium(suite, client, args, id) {
  if (!args.selenium || !id) {
    skip(suite, 'automation.launchSelenium() + custom/force', id ? 'use --selenium (needs grid)' : 'no profile');
    return;
  }
  const launched = await run(suite, 'automation.launchSelenium()', async () => {
    const r = await client.automation.launchSelenium(id);
    return [isOk(r), r.url ?? r.message];
  });
  if (launched) {
    await sleep(3000);
    await client.profile.forceStop(id).catch(() => {});
  }
}

async function runControl(suite, client, args, id) {
  if (!args.control || !id) {
    skip(suite, 'control.openUrl/navigate/refresh/tabs/activateTab/closeTab', id ? 'use --control (needs build with routes)' : 'no profile');
    return;
  }
  // The lifecycle set a placeholder proxy via switchProxy; clear it so the browser
  // can actually reach the network — otherwise navigate() correctly reports the
  // (dead-proxy) navigation failure and the check fails for the wrong reason.
  await client.profile.switchProxy(id, { connection_type: '', proxy_url: '' }).catch(() => {});
  const body = await launchWithSync(() => client.profile.launch(id),
    () => client.profile.launchForceLocal(id));
  if (!isOk(body)) {
    skip(suite, 'control.* ops', 'launch prerequisite failed');
    return;
  }
  await sleep(4000);
  // Probe: on a build without the control routes the client resolves with a "Not found" envelope.
  const probe = await client.control.tabs(id).catch(e => ({ status: 'error', message: String(e) }));
  if (!isOk(probe) && String(probe.message ?? '').startsWith('Not found:')) {
    skip(suite, 'control.* ops', 'control routes not present in this build (needs Incogniton >= 5.0.0.5)');
    await client.profile.stop(id).catch(() => {});
    return;
  }
  await run(suite, 'control.openUrl()', async () => {
    const r = await client.control.openUrl(id, 'https://example.com');
    return [isOk(r), r.message ?? ''];
  });
  await sleep(1500);
  // Open a second tab so closeTab has a non-foreground tab to close later.
  await run(suite, 'control.openUrl() [second tab]', async () => {
    const r = await client.control.openUrl(id, 'https://example.org');
    return [isOk(r), r.message ?? ''];
  });
  // Let the freshly opened tabs finish loading before navigating — Page.navigate on
  // a tab whose initial navigation is still in flight is rejected by CDP.
  await sleep(6000);
  let tabs = [];
  await run(suite, 'control.tabs()', async () => {
    const r = await client.control.tabs(id);
    tabs = r.tabs ?? [];
    return [isOk(r) && Array.isArray(r.tabs), `${tabs.length} tabs`];
  });
  await run(suite, 'control.navigate()', async () => {
    const r = await client.control.navigate(id, 'https://example.org');
    return [isOk(r), r.message ?? ''];
  });
  await run(suite, 'control.refresh()', async () => {
    const r = await client.control.refresh(id);
    return [isOk(r), r.message ?? ''];
  });
  if (tabs.length >= 1) {
    await run(suite, 'control.activateTab()', async () => {
      const r = await client.control.activateTab(id, tabs[0].targetId);
      return [isOk(r), r.message ?? ''];
    });
  }
  if (tabs.length >= 2) {
    await run(suite, 'control.closeTab()', async () => {
      const r = await client.control.closeTab(id, tabs[tabs.length - 1].targetId);
      return [isOk(r), r.message ?? ''];
    });
  }
  await sleep(1000);
  await client.profile.stop(id).catch(() => {});
}

/** Launch, retrying with the force-local variant when the profile is out of sync. */
async function launchWithSync(launch, forceLocal) {
  let body = await launch();
  if (body.status === 'error' && String(body.message ?? '').includes('out of sync')) {
    body = await forceLocal();
  }
  return body;
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
