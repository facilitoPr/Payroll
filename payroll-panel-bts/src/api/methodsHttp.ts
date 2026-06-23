import axios from "axios";
import { io } from "socket.io-client";
import {
  LOGIN_PATH,
  TOKEN_KEY,
  USER_KEY,
} from "src/constant/authStorage";
import { ep, unwrap } from "src/helpers/api";
import { getOrCreateDeviceId, getPlatformWeb } from "src/helpers/device";
import { getToken, setToken } from "./token";

const BASE_URL = process.env.API || "http://localhost:9003";

const API_BASE_URL = `${BASE_URL}/api`;

let isLoggingOut = false;

export const clearFrontendSession = () => {
  try {
    if (socket?.connected) socket.disconnect();
  } catch (_) {}

  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // ✅ NO borrar DEVICE_ID
  } catch (_) {}
};

export const forceLogoutAndRedirect = (reason = "unauthorized") => {
  if (isLoggingOut) return;
  isLoggingOut = true;

  clearFrontendSession();

  if (!window.location.pathname.startsWith(LOGIN_PATH)) {
    window.location.replace(LOGIN_PATH);
  }
};

// =========================
// AXIOS INSTANCE + INTERCEPTORS
// =========================

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

let refreshPromise: any = null;

const isRefreshRequest = (config: any) => {
  const url = String(config?.url || "");
  const h = config?.headers;

  const skip =
    h?.["x-skip-refresh"] ||
    h?.["X-Skip-Refresh"] ||
    (typeof h?.get === "function" ? h.get("x-skip-refresh") : undefined);

  return String(skip) === "1" || url.includes("/auth/refresh");
};

async function refreshAccessToken() {
  const deviceId = getOrCreateDeviceId();
  const platform = getPlatformWeb();

  const resp = await refreshClient.post(
    "/auth/refresh",
    { deviceId, platform },
    { headers: { "x-skip-refresh": "1" } },
  );

  const data = resp.data;
  if (!data?.ok || !data?.token) throw new Error("REFRESH_FAILED");

  setToken(data.token);
  return data.token;
}

api.interceptors.request.use((config) => {
  if (isRefreshRequest(config)) return config;

  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["x-access-token"] = token;
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  config.withCredentials = true;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    if (status !== 401) return Promise.reject(error);

    if (isRefreshRequest(originalRequest)) {
      forceLogoutAndRedirect("refresh_401");
      return Promise.reject(error);
    }

    if (originalRequest?._retry) {
      forceLogoutAndRedirect("axios_401_retry_failed");
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers["x-access-token"] = newToken;
      originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (e) {
      forceLogoutAndRedirect("refresh_failed");
      return Promise.reject(error);
    }
  },
);

// =========================
// SOCKET
// =========================
export const socket = io(BASE_URL, {
  autoConnect: !!getToken(),
  auth: { token: getToken() },
  reconnection: true,
  transports: ["websocket"],
  upgrade: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on("connect", () => console.log("[socket] connected", socket.id));

socket.on("disconnect", (reason) => {
  console.warn("[socket] disconnected:", reason);
});

socket.on("connect_error", async (e: any) => {
  const msg = (e?.message || "").toLowerCase();
  const unauthorized =
    msg.includes("unauthorized") ||
    e?.data?.status === 401 ||
    e?.data?.code === "UNAUTHORIZED";

  if (!unauthorized) return;

  try {
    const newToken = await refreshAccessToken();
    socket.auth = { token: newToken };
    if (socket.connected) socket.disconnect();
    socket.connect();
  } catch {
    forceLogoutAndRedirect("socket_refresh_failed");
  }
});

socket.on("reconnect_attempt", () => {
  socket.auth = { token: getToken() || "" };
});

export function connectSocketWithToken() {
  socket.auth = { token: getToken() || "" };
  if (socket.connected) socket.disconnect();
  socket.connect();
}

// ✅ logout real contra backend
export async function logoutHttp() {
  const deviceId = getOrCreateDeviceId();
  const platform = getPlatformWeb();

  const { data } = await api.post("/auth/logout", {
    deviceId,
    platform,
  });

  return data;
}

export async function getMeHttp() {
  const { data } = await api.get("/auth/me");
  return data;
}

export default {
  getApi(endPoint: string, config = {}) {
    return unwrap(api.get(ep(endPoint), config));
  },
  postApi(endPoint: string, data: any, config = {}) {
    return unwrap(api.post(ep(endPoint), data, config));
  },
  putApi(endPoint: string, data: any, config = {}) {
    return unwrap(api.put(ep(endPoint), data, config));
  },
  patchApi(endPoint: string, data: any, config = {}) {
    return unwrap(api.patch(ep(endPoint), data, config));
  },
  deleteApi(endPoint: string, config = {}) {
    return unwrap(api.delete(ep(endPoint), config));
  },  
  async postBlob(endPoint: string, data: any, config = {}) {
    const res = await api.post(ep(endPoint), data, {
      responseType: "blob",
      ...config,
    });
    return res.data;
  },
};
