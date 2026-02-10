import { io } from 'socket.io-client';

const getAuthToken = () => {
  return (
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt_token')
  );
};

const socket = io('http://localhost:5002/trading', {
  auth: {
    token: getAuthToken(),
  },
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling'],
});

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
