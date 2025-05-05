# Incogniton API Client (JS/TS)

The official JavaScript / TypeScript SDK for interacting with the [Incogniton Antidetect Browser API](https://api-docs.incogniton.com/) and browser automation capabilities. Visit our [official website](https://incogniton.com) to learn more about Incogniton.

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

// Create a new browser profile
const profile = await client.profile.add({
  profileData: {
    name: 'MY PROFILE',
    // ...
  },
});

// Get all profiles
const profiles = await client.profile.list();

// Get a specific profile
const profileDetails = await client.profile.get('PROFILE_ID');
```

### Browser Automation

```typescript
import { IncognitonBrowser } from 'incogniton';

const browser = new IncognitonBrowser({
  profileId: 'your-profile-id',
  headless: false,
});

// Launch a browser instance
const instance = await browser.start();

// Use the browser instance
const page = await instance.newPage();
await page.goto('https://example.com');

// Close the browser when done
await browser.close(instance);
```

## Configuration

### API Client Configuration

- `port`: Port number for the Incogniton instance (default: 35000)
- `baseUrl`: Base URL for API requests (default: http://localhost:${port})

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
