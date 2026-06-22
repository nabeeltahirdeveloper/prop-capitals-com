/* eslint-disable */
// Standalone probe: which symbols does Massive ACTUALLY stream live quotes for?
// Usage:  MASSIVE_API_KEY=xxxx node test-massive-symbols.js
// (or it will read MASSIVE_API_KEY from the backend .env automatically)
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// --- load key from env or .env ---
let API_KEY = process.env.MASSIVE_API_KEY;
if (!API_KEY) {
  try {
    const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    const m = env.match(/^MASSIVE_API_KEY=(.+)$/m);
    if (m) API_KEY = m[1].trim().replace(/^["']|["']$/g, '');
  } catch {}
}
if (!API_KEY) {
  console.error('❌ No MASSIVE_API_KEY found (env or .env).');
  process.exit(1);
}

const PAIRS = [
  'EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CAD','USD/CHF',
  'NZD/USD','EUR/GBP','EUR/JPY','GBP/JPY','CAD/JPY','XAU/USD','XAG/USD',
];
const TEST_SECONDS = 15;

const received = new Map(); // symbol -> { count, lastBid, lastAsk }
const ws = new WebSocket('wss://socket.massive.com/forex');

ws.on('open', () => {
  console.log('✅ connected — authenticating');
  ws.send(JSON.stringify({ action: 'auth', params: API_KEY }));
});

ws.on('message', (data) => {
  let msgs;
  try { msgs = JSON.parse(data.toString()); } catch { return; }
  if (!Array.isArray(msgs)) msgs = [msgs];
  for (const msg of msgs) {
    if (msg.ev === 'status') {
      console.log(`📡 status: ${msg.status} ${msg.message || ''}`);
      if (msg.status === 'auth_success') {
        const params = PAIRS.map((p) => `C.${p.replace('/', '-')}`).join(',');
        ws.send(JSON.stringify({ action: 'subscribe', params }));
        console.log(`📊 subscribed to ${PAIRS.length} symbols, listening ${TEST_SECONDS}s...\n`);
      }
      if (msg.status === 'auth_failed') { console.error('❌ auth failed — bad key'); process.exit(1); }
    } else if (msg.ev === 'C' && msg.p) {
      const r = received.get(msg.p) || { count: 0 };
      r.count++; r.lastBid = msg.b; r.lastAsk = msg.a;
      received.set(msg.p, r);
    }
  }
});

ws.on('error', (e) => console.error('WS error:', e.message));

setTimeout(() => {
  console.log('\n===== RESULT =====');
  for (const p of PAIRS) {
    const r = received.get(p);
    if (r) console.log(`✅ ${p.padEnd(8)} ${r.count} ticks   bid=${r.lastBid} ask=${r.lastAsk}`);
    else   console.log(`❌ ${p.padEnd(8)} NO DATA (falls back to mock)`);
  }
  console.log('==================');
  ws.close();
  process.exit(0);
}, TEST_SECONDS * 1000);
