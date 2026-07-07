# Incogniton Typescript SDK

The official JavaScript / TypeScript SDK for interacting with the [Incogniton Antidetect Browser API](https://api-docs.incogniton.com/) and browser automation capabilities, including Playwright, Puppeteer, and Selenium. Visit our [official website](https://incogniton.com) to learn more about Incogniton.

## Overview

The Incogniton Browser Client provides two main components:

1. **API Client**: A robust interface for interacting with Incogniton's REST API, allowing you to manage browser profiles, cookies, and automation tasks programmatically.

2. **Browser Automation**: A powerful browser automation module that integrates with Puppeteer, enabling you to launch and control Incogniton browser instances with custom profiles.

## Features

The Incogniton package contains two modules:

### API Client

- Profile Management: Create, update, and manage browser profiles
- Cookie Management: Add, update, and manage cookies for profiles
- Automation Control: Launch and control browser instances
- Comprehensive TypeScript support with full type definitions

### Browser Automation

- Seamless integration with Puppeteer
- Profile-based browser launching
- Headless mode support
- Custom browser arguments support
- Robust error handling and logging

## Installation

```bash
npm install incogniton
# or
yarn add incogniton
```

## Usage

Before using the Incogniton API Client or Browser Automation, ensure that the Incogniton desktop app is running (open) locally. The client relies on the Incogniton app to manage profiles and perform browser automation tasks.

### API Client

```typescript
import { IncognitonClient } from 'incogniton';

const client = new IncognitonClient();

// Target a non-default app port (the API port is configurable in the Debug settings tab)
const clientOnCustomPort = new IncognitonClient({ port: 40000 });

// Check the desktop app is reachable
const status = await client.system.alive(); // 'OK'

// Create a new browser profile
const profile = await client.profile.add({
  profileData: {
    general_profile_information: {
      profile_name: 'MY PROFILE',
      // ...
    },
  },
});

// Get all profiles
const profiles = await client.profile.list();

// Get a specific profile
const profileDetails = await client.profile.get('PROFILE_ID');

// Clone a profile — no options means an all-defaults clone (same name/group, all data).
// Pass options to customize: client.profile.clone('PROFILE_ID', { profileName: 'Copy' })
const clone = await client.profile.clone('PROFILE_ID');

// Control a running profile's browser (launch it first)
await client.profile.launch('PROFILE_ID');
await client.control.openUrl('PROFILE_ID', 'https://example.com');
const { tabs } = await client.control.tabs('PROFILE_ID');
await client.control.activateTab('PROFILE_ID', tabs[0].targetId);
```

### Browser Automation

```typescript
import { IncognitonBrowser } from 'incogniton';

const browser = new IncognitonBrowser({
  profileId: 'your-profile-id',
  headless: false,
});

// --- Puppeteer Example ---
// Launch a browser instance with Puppeteer
const puppeteerInstance = await browser.startPuppeteer();
const puppeteerPage = await puppeteerInstance.newPage();
await puppeteerPage.goto('https://example.com', { waitUntil: 'networkidle0' });
const puppeteerScreenshotBuffer = await puppeteerPage.screenshot({ path: 'example-screenshot.png' });

await browser.close(puppeteerInstance);

// --- Playwright Example ---
// Launch a browser instance with Playwright
const playwrightInstance = await browser.startPlaywright();
const playwrightPage = await playwrightInstance.newPage();
await playwrightPage.goto('https://example.com', { waitUntil: 'load' });
const playwrightScreenshotBuffer = await playwrightPage.screenshot({ path: 'example-screenshot.png' });
await browser.close(playwrightInstance);
```

## Configuration

### API Client Configuration

Pass an options object to the constructor: `new IncognitonClient({ baseUrl, timeout, port })`.
(The legacy positional form `new IncognitonClient(baseUrl, timeout)` still works.)

- `port`: Port number for the Incogniton instance (default: 35000). When set, `baseUrl` becomes `http://localhost:${port}`.
- `baseUrl`: Base URL for API requests (default: http://localhost:35000). Can be overridden by the `INCOGNITON_API_URL` environment variable.
- `timeout`: Request timeout in seconds (default: 60).

### Browser Configuration

- `profileId`: The ID of the profile to use
- `headless`: Whether to launch in headless mode (default: false)
- `customArgs`: Custom command-line arguments for the browser
- `launchTimeout`: Time to wait for browser launch in milliseconds (default: 60000)

## Development

### Prerequisites

- Node.js (v14 or higher)
- TypeScript (v4 or higher)
- Incogniton desktop application running locally

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Building

```bash
npm run build
# or
yarn build
```

### Testing

```bash
npm test
# or
yarn test
```

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For help or technical support, please reach out to <yusuf@incogniton.com> or visit [Incogniton support](https://incogniton.com/contact).
