import { IncognitonClient } from 'incogniton';
import { IncognitonBrowser } from 'incogniton';

// profileId=dabe4254-e661-4214-bfef-e89d6ffbcfe5

const listAllProfiles = async () => {
  const incog = new IncognitonClient();
  await incog.profile.stop('dabe4254-e661-4214-bfef-e89d6ffbcfe5');
  
  
};

listAllProfiles();

async function main() {
  try {
    // Initialize with a longer timeout
    const client = new IncognitonBrowser({});
    await client.start()
        
  } catch (error) {
    console.error('Failed to start browser:', error);
    process.exit(1);
  }
}

main();

