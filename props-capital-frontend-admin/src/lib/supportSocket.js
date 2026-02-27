import { io } from 'socket.io-client';

const getAuthToken = () => {
  return (
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('jwt_token')
  );
};

const baseUrl = import.meta.env.VITE_WEBSOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5101';
const supportSocket = io(`${baseUrl}/support`, {
  path: '/socket.io',
  auth: (cb) => cb({ token: getAuthToken() }),
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
  transports: ['polling', 'websocket'],
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
