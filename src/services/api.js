import axios from "axios";

const BASE_URL = "https://lms-backend-grdt.onrender.com";

// axios instance yaratamiz
const api = axios.create({
  baseURL: BASE_URL,
});

// Har bir so‘rovdan oldin tokenni headerga qo‘shamiz
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Javobda token eskirgan bo‘lsa — login sahifasiga yo‘naltiramiz
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token muddati tugagan yoki noto‘g‘ri
      localStorage.removeItem("token");
      window.location.href = "/login"; // Login sahifasiga o‘tkazamiz
    }
    return Promise.reject(error);
  }
);

export { api, BASE_URL };
