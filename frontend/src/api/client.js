import axios from "axios";
import localAdapter from "./localServer";
import { storage } from "../utils/storage";

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

// Check if running on localhost or deployed remotely (e.g. on Vercel)
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "");

// "api"   -> talk to the Express server (when on localhost with local backend)
// "local" -> run the full API inside the browser via localStorage (default when deployed on Vercel without external backend)
export const DATA_MODE =
  import.meta.env.VITE_DATA_MODE === "local" || (!isLocalhost && !SERVER_URL)
    ? "local"
    : (import.meta.env.VITE_DATA_MODE || "api");

const api = axios.create({
  baseURL: `${SERVER_URL}/api`,
  timeout: 20000,
  ...(DATA_MODE === "local" && { adapter: localAdapter }),
});

api.interceptors.request.use((config) => {
  const token = storage.get("ums_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const isLogin = error.config?.url?.includes("/auth/login");

    // token expired / invalid -> AuthContext logs the user out and the router sends them to /login
    if (status === 401 && !isLogin) {
      storage.remove("ums_token");
      storage.remove("ums_role");
      window.dispatchEvent(new Event("ums:session-expired"));
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (err) =>
  err?.response?.data?.message || (err?.code === "ERR_NETWORK" ? "Cannot reach the server. Is the backend running?" : err?.message) || "Something went wrong";

export default api;
