import express from 'express';
import compression from 'compression';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  clientIpFromHeaders,
  lookupCountry,
  buildGeoCookie,
} from './server/geo.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(root, 'dist');
const indexHtml = path.join(distDir, 'index.html');
const port = Number(process.env.PORT) || 3006;
const token = process.env.IPINFO_TOKEN;

// Small in-memory cache so repeat visitors behind the same NAT IP don't re-hit ipinfo.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const ipCache = new Map(); // ip -> { code, exp }
const getCached = (ip) => {
  const e = ipCache.get(ip);
  return e && e.exp > Date.now() ? e.code : undefined;
};
const setCached = (ip, code) => ipCache.set(ip, { code, exp: Date.now() + CACHE_TTL_MS });

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

// HTML document requests (and SPA fallback): stamp geo_country, serve index.html.
app.get('/{*path}', async (req, res) => {
  const hasCookie = (req.headers.cookie || '').includes('geo_country=');
  if (!hasCookie) {
    const ip = clientIpFromHeaders({
      xForwardedFor: req.headers['x-forwarded-for'],
      xRealIp: req.headers['x-real-ip'],
      remoteAddress: req.socket?.remoteAddress,
    });
    let code = getCached(ip);
    if (code === undefined) {
      code = await lookupCountry(ip, { token });
      setCached(ip, code);
    }
    const secure =
      req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', buildGeoCookie(code, { secure }));
  }
  // Never cache the per-user HTML response (would leak one visitor's cookie to others).
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(indexHtml);
});

app.listen(port, () => {
  console.log(`prop-capitals-frontend serving dist on :${port} (geo: ${token ? 'on' : 'off'})`);
});
