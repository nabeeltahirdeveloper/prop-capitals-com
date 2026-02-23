import { io } from "socket.io-client";
import { baseSocketOptions, getAuthToken, getRealtimeBaseUrl } from "@/lib/realtime";

const baseUrl = getRealtimeBaseUrl();

// Trading events gateway namespace
const socket = io(`${baseUrl}/trading`, {
  ...baseSocketOptions,
  auth: (cb) => cb({ token: getAuthToken() }),
  autoConnect: false,
  reconnectionAttempts: 10,
});

function tryConnect() {
  if (getAuthToken() && !socket.connected) socket.connect();
}

if (typeof window !== "undefined") {
  tryConnect();
  window.addEventListener("storage", (e) => {
    if (["token", "accessToken", "authToken", "jwt_token"].includes(e.key) && e.newValue) {
      tryConnect();
    }
  });
}

export function reconnectSocketWithToken() {
  socket.auth = (cb) => cb({ token: getAuthToken() });
  if (!getAuthToken()) return;
  if (!socket.connected) socket.connect();
  else socket.disconnect().connect();
}

socket.on("connect", () => {
  console.log("[socket] connected to /trading:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("[socket] disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("[socket] connection error:", error.message);
});

export default socket;
export { socket };
