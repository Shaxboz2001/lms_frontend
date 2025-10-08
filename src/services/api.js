const BASE_URL = "http://127.0.0.1:8001"; // Sizning FastAPI server manzilingiz
const token = localStorage.getItem("token"); // JWT tokenni localStorage'dan o'qiymiz

const config = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

export { BASE_URL, config };
