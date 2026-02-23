const stripTrailingSlash = (url) => String(url || "").replace(/\/+$/, "");

export const getRealtimeBaseUrl = () => {
  const envUrl =
    import.meta.env.VITE_WEBSOCKET_URL || import.meta.env.VITE_API_URL;
  if (envUrl) return stripTrailingSlash(envUrl);

  if (typeof window !== "undefined" && window.location?.origin) {
    return stripTrailingSlash(window.location.origin);
  }

  return "http://localhost:5002";
};

export const getAuthToken = () => {
  try {
    return (
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("jwt_token")
    );
  } catch (error) {
    return null;
  }
};

export const baseSocketOptions = {
  path: "/socket.io",
  transports: ["websocket"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
};
