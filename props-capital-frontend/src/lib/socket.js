import { io } from 'socket.io-client';

const getAuthToken = () => {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('jwt_token')
  );
};

const baseUrl = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:5002';
// Backend gateway is on namespace /trading – connect there with JWT
const socket = io(`${baseUrl}/trading`, {
  path: '/socket.io',
  auth: (cb) => cb({ token: getAuthToken() }),
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
  // polling-first: establishes HTTP long-poll handshake, then upgrades to WS.
  // This is required for nginx proxies (without ws headers) and Windows firewall.
  // 'websocket' first skips the polling handshake and never falls back on failure.
  transports: ['polling', 'websocket'],
});

// Connect only when token exists (avoids "Invalid token" before login)
function tryConnect() {
  if (getAuthToken() && !socket.connected) socket.connect();
}
if (typeof window !== 'undefined') {
  tryConnect();
  window.addEventListener('storage', (e) => {
    if (e.key === 'token' && e.newValue) tryConnect();
  });
}

export function reconnectSocketWithToken() {
  socket.auth = (cb) => cb({ token: getAuthToken() });
  if (getAuthToken()) {
    if (!socket.connected) socket.connect();
    else socket.disconnect().connect();
  }
}

socket.on('connect', () => {
  console.log('✅ Connected to trading WebSocket');
  console.log('📡 Socket ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('🔌 Connection error:', error.message);
  const token = getAuthToken();
  if (!token) {
    console.error('❌ No token found - make sure you are logged in');
  }
});

// ✅ ONLY default export (no named export)
export default socket;
export { socket };
