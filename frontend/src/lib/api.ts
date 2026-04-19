import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login: (username: string, password: string) =>
    api.post("/auth/login", { username, password }),
};

export const assetsApi = {
  list: () => api.get("/assets/"),
  upload: (file: File, name: string, asset_class: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name);
    fd.append("asset_class", asset_class);
    return api.post("/assets/upload", fd);
  },
  delete: (code: string) => api.delete(`/assets/${code}`),
};

export const portfoliosApi = {
  list: () => api.get("/portfolios/"),
  create: (config: object) => api.post("/portfolios/", config),
  get: (id: string) => api.get(`/portfolios/${id}`),
  update: (id: string, config: object) => api.put(`/portfolios/${id}`, config),
  delete: (id: string) => api.delete(`/portfolios/${id}`),
  backtest: (id: string) => api.post(`/portfolios/${id}/backtest`),
  result: (id: string) => api.get(`/portfolios/${id}/result`),
  duplicate: (id: string) => api.post(`/portfolios/${id}/duplicate`),
};

export default api;
