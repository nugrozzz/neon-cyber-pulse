// Script to capture 4 screenshots using Playwright at 1280x480

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const gameDir = join(here, 'game');
const screenshotsDir = join(here, 'screenshots');
mkdirSync(screenshotsDir, { recursive: true });

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

const server = createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = join(gameDir, urlPath);
  if (existsSync(filePath)) {
    const ext = extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(8080, async () => {
  console.log('Server running on http://localhost:8080');
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 480 } });
  const page = await context.newPage();

  const shots = [
    { name: '1-start.jpg', query: '?shot=start&seed=1' },
    { name: '2-early.jpg', query: '?shot=early&seed=1' },
    { name: '3-mid.jpg', query: '?shot=mid&seed=1' },
    { name: '4-end.jpg', query: '?shot=end&seed=1' },
  ];

  for (const shot of shots) {
    const url = `http://localhost:8080/${shot.query}`;
    console.log(`Capturing ${shot.name} from ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__shotReady === true, { timeout: 10000 }).catch(() => {});
    // extra pause just in case
    await page.waitForTimeout(500);
    const dest = join(screenshotsDir, shot.name);
    await page.screenshot({ path: dest, type: 'jpeg', quality: 90 });
    console.log(`Saved ${shot.name}`);
  }

  await browser.close();
  server.close();
  console.log('All screenshots captured successfully!');
});
