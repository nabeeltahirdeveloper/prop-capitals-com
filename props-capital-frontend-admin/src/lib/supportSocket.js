import { io } from 'socket.io-client';

// Use origin only so namespace is always "/support" (not e.g. "/api/support")
function getSupportSocketUrl() {
  const raw = import.meta.env.VITE_WEBSOCKET_URL || 'https://api-dev.prop-capitals.com';
  try {
    const u = new URL(raw);
    return `${u.origin}/support`;
  } catch {
    return raw.replace(/\/+$/, '').replace(/#.*$/, '') + '/support';
  }
}

const SUPPORT_SOCKET_URL = getSupportSocketUrl();
if (typeof window !== 'undefined') {
  console.log('[SupportSocket] Connecting to', SUPPORT_SOCKET_URL, '(namespace /support)');
}

const getAuthToken = () =>
  localStorage.getItem('accessToken') ||
  localStorage.getItem('token') ||
  localStorage.getItem('jwt_token');

const supportSocket = io(SUPPORT_SOCKET_URL, {
  path: '/socket.io',
  auth: (cb) => cb({ token: getAuthToken() }),
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  transports: ['websocket', 'polling'],
});

export function connectSupportSocket() {
  if (getAuthToken() && !supportSocket.connected) {
    supportSocket.connect();
  }
}

export function disconnectSupportSocket() {
  if (supportSocket.connected) {
    supportSocket.disconnect();
  }
}

supportSocket.on('connect', () => {
  console.log('[SupportSocket] Connected:', supportSocket.id);
});

supportSocket.on('disconnect', (reason) => {
  console.log('[SupportSocket] Disconnected:', reason);
});

supportSocket.on('connect_error', (error) => {
  console.error('[SupportSocket] Connection error:', error.message);
});

export default supportSocket;
