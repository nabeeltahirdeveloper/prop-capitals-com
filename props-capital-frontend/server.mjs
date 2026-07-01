import express from 'express';
import compression from 'compression';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import {
  clientIpFromHeaders,
  lookupCountry,
  buildGeoCookie,
  parseLocaleCookie,
  decideLanguageRedirect,
  isLocalePrefixedPath,
} from './server/geo.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(root, 'dist');
const indexHtml = path.join(distDir, 'index.html');
const port = Number(process.env.PORT) || 3006;

// IPINFO_TOKEN normally comes from the pm2 process env. If it isn't set there, fall back to
// the (gitignored) .env file next to this server, so a fresh `pm2 start` still picks it up.
// Process env wins — .env only fills the gap. Note: server.mjs is plain Node, so without
// this it would NOT read .env at all (that file is otherwise Vite build-time VITE_* only).
const readTokenFromEnvFile = () => {
  try {
    const m = fs
      .readFileSync(path.join(root, '.env'), 'utf8')
      .match(/^\s*IPINFO_TOKEN\s*=\s*(.*)\s*$/m);
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : undefined;
  } catch {
    return undefined;
  }
};
const token = process.env.IPINFO_TOKEN || readTokenFromEnvFile();

// Small in-memory cache so repeat visitors behind the same NAT IP don't re-hit ipinfo.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const IP_CACHE_MAX = 5000; // bound memory: evict the oldest entry past this many distinct IPs
const ipCache = new Map(); // ip -> { code, exp }
const getCached = (ip) => {
  const e = ipCache.get(ip);
  return e && e.exp > Date.now() ? e.code : undefined;
};
const setCached = (ip, code) => {
  if (ipCache.size >= IP_CACHE_MAX) ipCache.delete(ipCache.keys().next().value);
  ipCache.set(ip, { code, exp: Date.now() + CACHE_TTL_MS });
};

const app = express();
app.set('trust proxy', true);
app.disable('x-powered-by');
app.use(compression());

// Static assets: long-cache hashed files under /assets, served directly (no geo work).
app.use(
  express.static(distDir, {
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }),
);

// HTML document requests: (1) redirect unprefixed geo-matched visitors to /tr or /kk,
// (2) otherwise serve index.html and keep stamping the geo_country cookie (currency).
app.get('/{*path}', async (req, res) => {
  const reqPath = req.path || '/';
  const cookieHeader = req.headers.cookie || '';
  const localeCookie = parseLocaleCookie(cookieHeader);
  const hasGeoCookie = cookieHeader.includes('geo_country=');
  const isPrefixedPath = isLocalePrefixedPath(reqPath);

  // One country lookup, reused for the redirect decision AND the geo_country cookie.
  // Needed when a redirect is possible (unprefixed, no locale cookie) or to stamp the cookie.
  let country = '';
  const mayRedirect = !isPrefixedPath && !localeCookie;
  if (mayRedirect || !hasGeoCookie) {
    const ip = clientIpFromHeaders({
      xForwardedFor: req.headers['x-forwarded-for'],
      xRealIp: req.headers['x-real-ip'],
      remoteAddress: req.socket?.remoteAddress,
    });
    let c = getCached(ip);
    if (c === undefined) {
      c = await lookupCountry(ip, { token });
      setCached(ip, c);
    }
    country = c || '';
  }

  // Language redirect (unprefixed geo-matched visitors -> /tr or /kk), preserving the query string.
  const target = decideLanguageRedirect({ path: reqPath, localeCookie, country });
  if (target) {
    const qs = req.url.slice(reqPath.length); // querystring; hash never reaches the server
    res.redirect(302, target + qs);
    return;
  }

  // Serve index.html. Stamp geo_country for the (unchanged) currency system when absent.
  if (!hasGeoCookie) {
    const secure =
      req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', buildGeoCookie(country, { secure }));
  }
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(indexHtml);
});

app.listen(port, () => {
  console.log(`prop-capitals-frontend serving dist on :${port} (geo: ${token ? 'on' : 'off'})`);
});
