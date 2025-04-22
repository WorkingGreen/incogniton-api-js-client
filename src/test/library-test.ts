import { IncognitonBrowser } from '../browser/incogniton.browser.js';

async function main() {
  try {
    // Initialize with a longer timeout
    const client = new IncognitonBrowser();
    
    console.log("🚀 Starting browser...");
    await client.quickstart();
  } catch (error) {
    console.error('Failed to start browser:', error);
    process.exit(1);
  }
}

main();
