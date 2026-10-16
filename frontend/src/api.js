import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (
      error.response?.status === 401 &&
      !String(error.config?.url || "").includes("/auth/login")
    )
      window.dispatchEvent(new Event("fixl:unauthorized"));
    return Promise.reject(error);
  },
);
export const getData = async (url, config) => (await api.get(url, config)).data;
