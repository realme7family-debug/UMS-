import axios from "axios";
import localAdapter from "./localServer";
import { storage } from "../utils/storage";

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

// "api"   -> talk to the Express server (default)
// "local" -> run the API inside the browser, data kept in localStorage
export const DATA_MODE = import.meta.env.VITE_DATA_MODE === "local" ? "local" : "api";

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
