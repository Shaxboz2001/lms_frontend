const BASE_URL = "https://lms-backend-grdt.onrender.com"; // Sizning FastAPI server manzilingiz
const token = localStorage.getItem("token"); // JWT tokenni localStorage'dan o'qiymiz

const config = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

export { BASE_URL, config };
