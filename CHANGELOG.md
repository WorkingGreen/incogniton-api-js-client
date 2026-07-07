# Changelog

## [1.2.0] - 2026-06-30

### Added

- `client.control` — live browser-control operations for an already-running profile, matching the V5 automation API's `control` endpoints:
  - `control.openUrl(id, url)` — open a URL (reuses a free blank tab, else opens a new one).
  - `control.navigate(id, url)` — navigate the foreground tab in place.
  - `control.refresh(id)` — refresh the foreground tab.
  - `control.tabs(id)` — list open tabs (`{ tabs: BrowserTab[] }`, each with `targetId` / `url` / `title`).
  - `control.activateTab(id, targetId)` / `control.closeTab(id, targetId)` — bring a tab to the foreground / close it.
- Exported the new `BrowserTab` type.

### Tests

- Unit test (`incogniton.client.unit.test.ts`) now asserts the route, verb, and body for **every** client method (system, profile CRUD + lifecycle, cookie, control, and all automation launch variants) — runs without a live app.
- Live smoke test (`tools/automation-api-smoke-test.mjs`) now covers the `control` routes: safe error-path checks for all six, plus an opt-in `--control` flag that launches Chrome and drives open/navigate/refresh/list-activate-close-tabs over CDP. On a build that predates the control routes the checks skip cleanly (detected via the router's "Not found" envelope) instead of failing.

### Fixed

- `client.profile.list()` now targets `GET /profile/all/` (the trailing slash is part of the registered V5 route) and returns the profile array under `profileData` — the real wire key. The previous `/profile/all` path and `profiles` key did not match the server (`res.profiles` was always `undefined` at runtime — same bug class as the earlier `CookieData` fix).

### Migration notes

- JavaScript scripts run unchanged.
- TypeScript-only: `profile.list()` now returns `{ profileData: BrowserProfile[]; status }` instead of `{ profiles: ... }`. Read `res.profileData` (this is what the server has always actually sent).

## [1.1.0] - 2026-06-17

### Added

- `client.system` operations: `alive()` (health probe) and `close()` (shut down the Incogniton app).
- Profile cloning: `client.profile.clone(id, options)` (custom settings) and `client.profile.cloneQuick(id)` (all-defaults).
- Dry-launch (build a launch without opening a browser): `client.profile.dryLaunch(id)`, `dryLaunchForceLocal`, and `dryLaunchForceCloud`.
- Automation force-sync launch variants: `launchPuppeteerForceLocal` / `launchPuppeteerForceCloud` and `launchSeleniumForceLocal` / `launchSeleniumForceCloud`.
- `client.automation.launchSeleniumCustomBody(id, options)` — Selenium custom-args launch with the profile id in the request body.
- `client.automation.launchCookieRobot(id)` — run the cookie-collection robot.
- The constructor now accepts an options object: `new IncognitonClient({ baseUrl, timeout, port })`. The optional `port` targets a non-default app port. The legacy positional `(baseUrl, timeout)` signature still works.

### Changed

- `system.alive()` normalizes the server response (JSON-quoted `"OK"` or bare `OK`) to a plain `'OK'` across app versions.
- Browser launches (`IncognitonBrowser.startPuppeteer` / `startPlaywright`) now poll the CDP endpoint and connect as soon as it's ready, instead of waiting a fixed `launchTimeout` delay — launches return in ~1–2 s instead of always waiting the full timeout.
- Launching a browser no longer clears the host process's other `SIGINT` handlers.
- Updated dependencies: `axios` → ^1.18.0, `qs` → ^6.15.2. Bumped the `playwright` / `playwright-core` peer range to ^1.61.0 (`puppeteer-core` peer unchanged at ^22).

### Fixed

- Corrected `GetCookieResponse`: the cookie array is exposed under the key `'CookieData '` (with the trailing space the server actually sends) — reading `res.CookieData` was always `undefined` at runtime.
- `IncognitonBrowser` passed `launchTimeout` (ms) where the request layer expected seconds, inflating the HTTP timeout 1000×.
- Puppeteer custom-launch routes now use the trailing-slash path the server registers (`/automation/launch/puppeteer/`).
- `ProfileStatus` now matches the server's capitalized display names (e.g. `"Ready"`); it was previously lowercase and never matched `getStatus()`.

### Migration notes (no runtime breaks)

- Existing JavaScript scripts run unchanged. The constructor, all existing methods, and their runtime behavior are backward-compatible.
- TypeScript-only: the exported `BrowserProfile`, `CreateBrowserProfileRequest`, `UpdateBrowserProfileRequest`, `GetCookieResponse`, and `AddCookieRequest` types now match the real API shapes (they previously did not). Code that already matched runtime keeps compiling; code that relied on the old (incorrect) shapes may surface a compile error pointing at a latent bug. The redundant `models/automation.types` and `models/cookies.types` modules were removed (they were never reachable via the package's `exports` map).
- Playwright users may need to bump `playwright`/`playwright-core` to ^1.61 to satisfy the peer range.

## [1.0.17] - 2025-10-31

### Changed

- All SDK HTTP requests now use a 60s default timeout.
Can be customized when instantiating the client or on individual calls.

## [1.0.16] - 2025-10-24

### Added

- Added robust CDP readiness polling (`waitForCDP`) with exponential backoff and per-request timeouts to improve browser startup reliability.

### Changed

- Use `BrowserConfig.launchTimeout` as the canonical launch timeout for Playwright/Puppeteer connections.
- Replaced fixed sleeps with polling for CDP readiness to reduce flakiness when connecting to local Incogniton automation.
- Made `playwright` a peer dependency (and retained it in devDependencies) so consumers opt-in to the automation runtime; kept `puppeteer-core` as a peer dependency as well.

### Fixed

- Reduced wasted wait cycles in CDP polling by aligning per-request timeouts with polling cadence and introducing backoff logic.

## [1.0.15] - 2024-03-26

### Changed
- Updated repository URL to reflect the new public repository URL

## [1.0.14] - 2024-05-21

### Changed

- Updated `testFingerprint` method (IPHey fingerprinting test) to adapt to the recent UI changes on iphey.com, ensuring accuracy.

## [1.0.13] - 2024-03-XX

### Changed

- Reduced package size by excluding example files while maintaining full source code in repository

## [1.0.12] - 2025-04-25

### Changed

- Improved module resolution configuration in tsconfig.json
- Added source maps and declaration maps for better debugging
- Updated build process

## [1.0.9] - 2025-04-24

### Changed

- Fixed profile update endpoint to match API spec
- Improved profile creation with consistent JS docs

## [1.0.8]

### Changed

- Improved form URL encoding for profile updates using qs library
- Simplified HTTP request wrapper by removing boilerplate code
- Fixed profile update functionality

### Added

- Initial public release
- API Client for Incogniton
- Browser Automation with Puppeteer support
- TypeScript support
- Full test coverage
- Comprehensive documentation
