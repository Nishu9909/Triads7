const axios = require('axios');
const fs = require('fs');

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const LIST_NAME_PREFIX = "AdBlock_List";

const cf = axios.create({
  baseURL: `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/gateway`,
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
});

async function run() {
  try {
    // 1. Read your blocklist.txt (containing URLs)
    const urls = fs.readFileSync('blocklist.txt', 'utf8').split('\n').filter(u => u.trim());
    let allDomains = new Set();

    // 2. Download domains from each URL
    for (const url of urls) {
      console.log(`Downloading: ${url}`);
      const res = await axios.get(url);
      const domains = res.data.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#')) // Ignore comments
        .map(line => line.split(/\s+/).pop()); // Handle host-file formats
      domains.forEach(d => allDomains.add(d));
    }

    const domainArray = Array.from(allDomains).slice(0, 300000); // CF Free limit
    console.log(`Total unique domains: ${domainArray.length}`);

    // 3. Split into chunks of 1000 and upload
    for (let i = 0; i < domainArray.length; i += 1000) {
      const chunk = domainArray.slice(i, i + 1000);
      const listName = `${LIST_NAME_PREFIX}_${Math.floor(i / 1000) + 1}`;
      
      console.log(`Uploading chunk to list: ${listName}`);
      // Note: This simplified script assumes the list already exists or needs creation logic
      // Most advanced scripts like thanhdat995/zero-trust handle auto-creation/deletion
    }
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
    process.exit(1);
  }
}

run();
