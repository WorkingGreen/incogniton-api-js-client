# Changelog

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
