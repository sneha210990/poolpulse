// @ts-check
const { defineConfig } = require('@playwright/test');

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';

// Parse proxy URL to extract components for Playwright
let proxyConfig = undefined;
if (proxyUrl) {
  try {
    const url = new URL(proxyUrl);
    proxyConfig = {
      server: `${url.protocol}//${url.hostname}:${url.port}`,
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
    };
  } catch (e) {
    console.warn('Could not parse proxy URL:', e.message);
  }
}

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 0,
  use: {
    headless: true,
    launchOptions: {
      executablePath: '/usr/bin/google-chrome-stable',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    },
    proxy: proxyConfig,
    ignoreHTTPSErrors: true,
    screenshot: 'on',
    trace: 'on-first-retry',
  },
  reporter: [['list']],
});
