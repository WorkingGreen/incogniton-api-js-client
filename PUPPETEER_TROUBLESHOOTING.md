# Puppeteer Troubleshooting Guide

## Common Issues and Solutions

### 1. Missing Peer Dependencies

**Problem**: `puppeteer-core` is not installed
**Error**: `Missing peer dependency: puppeteer-core is required for browser automation features`

**Solution**:
```bash
npm install puppeteer-core
# or
yarn add puppeteer-core
```

**Note**: The SDK uses `puppeteer-core` as a peer dependency, not `puppeteer`. Make sure you have the correct package installed.

### 2. Incogniton Desktop Application Not Running

**Problem**: Incogniton desktop application is not running or not accessible
**Error**: Connection refused, timeout errors, or API endpoint not found

**Solution**:
1. Ensure Incogniton desktop application is running
2. Check that it's listening on the default port (35000)
3. Verify the API is accessible at `http://localhost:35000`

### 3. Profile Issues

**Problem**: Invalid or non-existent profile ID
**Error**: Profile not found, launch failures

**Solution**:
```typescript
// First, list available profiles
const client = new IncognitonClient();
const profiles = await client.profile.list();
console.log('Available profiles:', profiles);

// Use a valid profile ID
const browser = new IncognitonBrowser({
  profileId: 'your-valid-profile-id'
});
```

### 4. Launch Timeout Issues

**Problem**: Browser launch takes too long and times out
**Error**: Timeout errors, launch failures

**Solution**:
```typescript
const browser = new IncognitonBrowser({
  profileId: 'your-profile-id',
  launchTimeout: 60000, // Increase timeout to 60 seconds
  headless: false // Try non-headless mode first
});
```

### 5. API Endpoint Mismatch

**Problem**: The SDK is using different endpoints than expected
**Current Issue**: The `IncognitonBrowser.startPuppeteer()` method uses POST to `/automation/launch/puppeteer`, but the `IncognitonClient.automation.launchPuppeteer()` uses GET to `/automation/launch/puppeteer/{profile_id}`

**Solution**: Use the correct method for your use case:

```typescript
// Option 1: Use IncognitonBrowser (recommended for automation)
const browser = new IncognitonBrowser({ profileId: 'your-profile-id' });
const puppeteerInstance = await browser.startPuppeteer();

// Option 2: Use IncognitonClient for direct API calls
const client = new IncognitonClient();
const response = await client.automation.launchPuppeteer('your-profile-id');
```

### 6. Browser Connection Issues

**Problem**: Puppeteer fails to connect to the launched browser
**Error**: Connection refused, WebSocket errors

**Solution**:
```typescript
try {
  const browser = await puppeteer.connect({
    browserURL: puppeteerUrl,
    ignoreHTTPSErrors: true,
    // Add additional options if needed
    timeout: 30000
  });
} catch (error) {
  console.error('Connection failed:', error);
  // Check if the browser URL is correct
  console.log('Attempted to connect to:', puppeteerUrl);
}
```

### 7. Headless Mode Issues

**Problem**: Headless mode not working properly
**Error**: Browser launches but automation fails

**Solution**:
```typescript
// Try non-headless mode first
const browser = new IncognitonBrowser({
  profileId: 'your-profile-id',
  headless: false
});

// If headless is needed, ensure proper arguments
const browser = new IncognitonBrowser({
  profileId: 'your-profile-id',
  headless: true,
  customArgs: '--headless=new --no-sandbox --disable-setuid-sandbox'
});
```

### 8. Profile Status Issues

**Problem**: Profile is already running or in an invalid state
**Error**: Profile already launched, status conflicts

**Solution**:
```typescript
const client = new IncognitonClient();

// Check profile status before launching
const status = await client.profile.getStatus('your-profile-id');
console.log('Profile status:', status);

// Stop the profile if it's running
if (status.status === 'running') {
  await client.profile.stop('your-profile-id');
  // Wait a moment for the profile to stop
  await new Promise(resolve => setTimeout(resolve, 2000));
}

// Now launch the browser
const browser = new IncognitonBrowser({ profileId: 'your-profile-id' });
const instance = await browser.startPuppeteer();
```

### 9. Quickstart Method Issues

**Problem**: Using `quickstart()` without proper configuration
**Error**: Profile creation fails, browser launch fails

**Solution**:
```typescript
const browser = new IncognitonBrowser();

// Use quickstart with proper error handling
try {
  const instance = await browser.quickstart('My Profile Name', {
    profile_notes: 'Created via quickstart',
    simulated_operating_system: 'Windows'
  });
  
  // Test the browser
  const page = await instance.newPage();
  await page.goto('https://example.com');
  console.log('Browser working correctly');
  
  await browser.close(instance);
} catch (error) {
  console.error('Quickstart failed:', error);
}
```

### 10. Debugging Steps

**Step-by-step debugging**:

1. **Check Incogniton is running**:
   ```bash
   curl http://localhost:35000/profile/all
   ```

2. **Verify profile exists**:
   ```typescript
   const client = new IncognitonClient();
   const profiles = await client.profile.list();
   console.log('Available profiles:', profiles);
   ```

3. **Test profile launch manually**:
   ```typescript
   const client = new IncognitonClient();
   const response = await client.automation.launchPuppeteer('your-profile-id');
   console.log('Launch response:', response);
   ```

4. **Check browser connection**:
   ```typescript
   const browser = new IncognitonBrowser({ profileId: 'your-profile-id' });
   const instance = await browser.startPuppeteer();
   console.log('Browser connected:', instance.isConnected());
   ```

### 11. Alternative: Use Playwright Instead

If Puppeteer continues to have issues, try Playwright:

```typescript
const browser = new IncognitonBrowser({ profileId: 'your-profile-id' });
const playwrightInstance = await browser.startPlaywright();
const page = await playwrightInstance.newPage();
await page.goto('https://example.com');
await browser.close(playwrightInstance);
```

## Environment Requirements

- Node.js >= 16.0.0
- Incogniton desktop application running locally
- `puppeteer-core` installed as peer dependency
- Incogniton API accessible at `http://localhost:35000` (default)

## Getting Help

If you're still experiencing issues:

1. Check the Incogniton desktop application logs
2. Verify your profile configuration in the Incogniton UI
3. Test with a simple profile first (minimal configuration)
4. Try the Playwright alternative
5. Check the GitHub issues for similar problems


