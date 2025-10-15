import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import { BASE_URL, config } from "../services/api";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    price: "",
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Kurslarni olish
  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/courses/`, config);
      setCourses(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Kurslarni olishda xatolik yuz berdi!");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Sana formatini tozalash funksiyasi
  const normalizeDate = (s) => {
    if (!s) return null;
    if (s.includes("T")) return s.split("T")[0];
    if (/^\d{8}$/.test(s)) {
      const d = s.slice(0, 2),
        m = s.slice(2, 4),
        y = s.slice(4);
      return `${y}-${m}-${d}`;
    }
    return s;
  };

  // Kurs yaratish
  const handleCreateCourse = async () => {
    try {
      if (!newCourse.title || !newCourse.start_date) {
        setErrorMsg("Iltimos, barcha majburiy maydonlarni to‘ldiring!");
        return;
      }

      const payload = {
        ...newCourse,
        start_date: normalizeDate(newCourse.start_date),
        end_date: normalizeDate(newCourse.end_date),
        price: parseFloat(newCourse.price) || 0,
      };

      const res = await axios.post(`${BASE_URL}/courses/`, payload, config);
      setSuccessMsg(`"${res.data.title}" kursi muvaffaqiyatli qo‘shildi!`);
      setNewCourse({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        price: "",
      });
      fetchCourses();
    } catch (err) {
      console.error(err);
      setErrorMsg("Kurs yaratishda xatolik yuz berdi!");
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Kurslarni boshqarish
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* ✅ Yangi kurs yaratish formasi */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Yangi kurs yaratish
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Kurs nomi"
                fullWidth
                value={newCourse.title}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, title: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Narxi (so‘m)"
                type="number"
                fullWidth
                value={newCourse.price}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, price: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Boshlanish sanasi"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newCourse.start_date}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, start_date: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Tugash sanasi"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newCourse.end_date}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, end_date: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Tavsif"
                fullWidth
                multiline
                rows={3}
                value={newCourse.description}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, description: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateCourse}
              >
                Kursni qo‘shish
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 📋 Kurslar ro‘yxati */}
      <Typography variant="h6" gutterBottom>
        Mavjud kurslar
      </Typography>
      <Grid container spacing={2}>
        {courses.length > 0 ? (
          courses.map((course) => (
            <Grid item xs={12} md={6} lg={4} key={course.id}>
              <Card sx={{ p: 2 }}>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {course.title}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {course.description || "Tavsif yo‘q"}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <b>Boshlanish:</b> {course.start_date || "—"}
                  </Typography>
                  <Typography variant="body2">
                    <b>Narx:</b>{" "}
                    {course.price
                      ? `${course.price.toLocaleString()} so‘m`
                      : "—"}
                  </Typography>
                  <Typography variant="body2">
                    <b>Yaratgan:</b> {course.creator_name || "Noma’lum"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Typography variant="body1" sx={{ ml: 2 }}>
            Hozircha kurs mavjud emas.
          </Typography>
        )}
      </Grid>

      {/* ✅ Snackbarlar */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg("")}
      >
        <Alert severity="success">{successMsg}</Alert>
      </Snackbar>
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={3000}
        onClose={() => setErrorMsg("")}
      >
        <Alert severity="error">{errorMsg}</Alert>
      </Snackbar>
    </Box>
  );
}
