import { io } from 'socket.io-client';

const getAuthToken = () => {
  return (
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt_token')
  );
};

const socket = io('https://api-dev.prop-capitals.com/trading', {
  path: '/socket.io',
  auth: (cb) => cb({ token: getAuthToken() }),
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling'],
});

function tryConnect() {
  if (getAuthToken() && !socket.connected) socket.connect();
}
if (typeof window !== 'undefined') {
  tryConnect();
  window.addEventListener('storage', (e) => {
    if ((e.key === 'accessToken' || e.key === 'token') && e.newValue) tryConnect();
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
