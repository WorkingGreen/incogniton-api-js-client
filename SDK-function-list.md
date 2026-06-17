# Incogniton JS/TS SDK – Function List

Below is a summary of the most commonly used methods and operations available in the Incogniton JS/TS SDK. For a complete and up-to-date API reference, please see the official Incogniton API Documentation.

---

## System Operations (`client.system`)

```typescript
await client.system.alive();
// Health probe. Returns the string 'OK' when the desktop app is reachable.

await client.system.close();
// Shut down the Incogniton application.
```

---

## Profile Operations (`client.profile`)

```typescript
await client.profile.list();
// List all browser profiles.

await client.profile.get(profileId);
// Get a specific browser profile.

await client.profile.add(createRequest);
// Add a new browser profile. `createRequest` is a `CreateBrowserProfileRequest`.

await client.profile.update(profileId, updateRequest);
// Update an existing browser profile. `updateRequest` is an `UpdateBrowserProfileRequest`.

await client.profile.switchProxy(profileId, proxy);
// Update a browser profile's proxy configuration.

await client.profile.clone(profileId, options);
// Clone a profile with custom settings. `options` is a `CloneProfileOptions`
// (profileName, targetGroup, cloneCookies, …). Returns the new clone's id.

await client.profile.cloneQuick(profileId);
// Clone a profile using all-default settings (same name/group, every clone option on).

await client.profile.launch(profileId);
// Launch a browser profile.

await client.profile.launchForceLocal(profileId);
// Force a browser profile to launch in local mode.

await client.profile.launchForceCloud(profileId);
// Force a browser profile to launch in cloud mode.

await client.profile.dryLaunch(profileId);
// Prepare a launch without opening a browser; returns the built launch command as `arg`.

await client.profile.dryLaunchForceLocal(profileId);
// Dry-launch, forcing the local copy when out of sync.

await client.profile.dryLaunchForceCloud(profileId);
// Dry-launch, forcing the cloud copy when out of sync.

await client.profile.getStatus(profileId);
// Get the current status of a browser profile.

await client.profile.stop(profileId);
// Stop a running browser profile.

await client.profile.forceStop(profileId);
// Force stop a running browser profile (immediate termination).

await client.profile.delete(profileId);
// Delete a browser profile.
```

---

## Cookie Operations (`client.cookie`)

```typescript
await client.cookie.get(profileId);
// Get all cookies associated with a browser profile.

await client.cookie.add(profileId, cookieData);
// Add a new cookie to a browser profile. `cookieData` is an array of cookie objects.

await client.cookie.delete(profileId);
// Delete all cookies from a browser profile.
```

---

## Automation Operations (`client.automation`)

```typescript
await client.automation.launchPuppeteer(profileId);
// Launch a browser profile with Puppeteer automation.

await client.automation.launchPuppeteerForceLocal(profileId);
// Launch for Puppeteer, forcing the local copy when out of sync.

await client.automation.launchPuppeteerForceCloud(profileId);
// Launch for Puppeteer, forcing the cloud copy when out of sync.

await client.automation.launchPuppeteerCustom(profileId, customArgs);
// Launch a browser profile with Puppeteer automation using custom arguments.

await client.automation.launchSelenium(profileId);
// Launch a browser profile with Selenium automation.

await client.automation.launchSeleniumForceLocal(profileId);
// Launch on the Selenium grid, forcing the local copy when out of sync.

await client.automation.launchSeleniumForceCloud(profileId);
// Launch on the Selenium grid, forcing the cloud copy when out of sync.

await client.automation.launchSeleniumCustom(profileId, customArgs);
// Launch with Selenium using custom arguments (profile id in the URL path).

await client.automation.launchSeleniumCustomBody(profileId, options);
// Launch on the Selenium grid with custom args, profile id in the request body.
// `options` may set { customArgs, forceLocal, forceCloud }.

await client.automation.launchCookieRobot(profileId);
// Run the cookie-collection robot on a profile (top-50 sites, 120s timeout, cloud copy).
```

---

## Browser Automation SDK (`IncognitonBrowser`)

```typescript
const browser = await IncognitonBrowser.startPlaywright(profileId);
// Launch the profile and return a connected Playwright browser instance (Recommended).

const driver = await IncognitonBrowser.startSelenium(profileId);
// Launch the profile and return a connected Selenium WebDriver instance.

await IncognitonBrowser.close(browser);
// Close a single Playwright browser instance with logging and error handling.

await IncognitonBrowser.closeAll([browser1, browser2, ...]);
// Close multiple Playwright browser instances in parallel with logging and error handling.
```

---

**Note:**  
- All methods return Promises and should be used with `await` or `.then()`.
- Types like `CreateBrowserProfileRequest`, `UpdateBrowserProfileRequest`, and `Proxy` are defined in the SDK's type definitions.

For more details, refer to the official Incogniton API documentation or the SDK's type definitions. 