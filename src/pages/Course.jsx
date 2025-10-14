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
  CircularProgress,
} from "@mui/material";
import { api, BASE_URL, config } from "../services/api";

export default function Courses() {
  const [role, setRole] = useState("");
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: "",
    subject: "",
    teacher_name: "",
    price: "",
    start_date: "",
    description: "",
  });

  const userRole = localStorage.getItem("role");

  useEffect(() => {
    setRole(userRole);
  }, [userRole]);

  const fetchCourses = async () => {
    try {
      const res = await api.get(`/courses`);
      setCourses(res.data);
    } catch (err) {
      console.error("Kurslarni olishda xatolik:", err);
    }
  };

  const fetchMyCourses = async () => {
    try {
      const res = await api.get(`/courses/my`);
      setMyCourses(res.data);
    } catch (err) {
      console.error("Mening kurslarimni olishda xatolik:", err);
    }
  };

  useEffect(() => {
    if (role) {
      fetchCourses();
      if (role === "student") fetchMyCourses();
    }
  }, [role]);

  // Manager: kurs yaratish
  const handleCreateCourse = async () => {
    if (!newCourse.title.trim()) return alert("Kurs nomi kiritilishi kerak!");
    try {
      await api.post(`/courses`, newCourse);
      alert("✅ Kurs muvaffaqiyatli yaratildi!");
      setNewCourse({
        title: "",
        subject: "",
        teacher_name: "",
        price: "",
        start_date: "",
        description: "",
      });
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.detail || "❌ Kurs yaratishda xatolik!");
    }
  };

  // Student: kursga qo‘shilish
  const handleJoinCourse = async (id) => {
    setLoading(true);
    try {
      await api.post(`/courses/${id}/join`, {});
      alert("✅ Siz kursga muvaffaqiyatli qo‘shildingiz!");
      fetchMyCourses();
    } catch (err) {
      alert(err.response?.data?.detail || "❌ Kursga qo‘shilishda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4} sx={{ bgcolor: "#f5f6fa", minHeight: "100vh" }}>
      {role === "manager" ? (
        <>
          {/* === Kurs yaratish bo‘limi === */}
          <Typography variant="h4" gutterBottom fontWeight="bold">
            🎓 Yangi kurs yaratish
          </Typography>

          <Card sx={{ p: 3, mb: 5, boxShadow: 3, borderRadius: 3 }}>
            <Grid container spacing={2}>
              {[
                ["title", "Kurs nomi"],
                ["subject", "Fan nomi"],
                ["teacher_name", "O‘qituvchi ismi"],
                ["price", "Narx (so‘m)"],
                ["start_date", "Boshlanish sanasi"],
              ].map(([key, label]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <TextField
                    label={label}
                    variant="outlined"
                    fullWidth
                    value={newCourse[key]}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, [key]: e.target.value })
                    }
                  />
                </Grid>
              ))}

              <Grid item xs={12}>
                <TextField
                  label="Kurs haqida qisqacha"
                  multiline
                  rows={3}
                  fullWidth
                  value={newCourse.description}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, description: e.target.value })
                  }
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 3 }}
              onClick={handleCreateCourse}
            >
              💾 Kursni yaratish
            </Button>
          </Card>

          {/* === Barcha kurslar (reklama) === */}
          <Typography variant="h5" gutterBottom>
            📢 Barcha kurslar (reklama sifatida)
          </Typography>
          <Grid container spacing={2}>
            {courses.map((c) => (
              <Grid item xs={12} md={6} key={c.id}>
                <Card sx={{ p: 3, borderLeft: "6px solid #1976d2" }}>
                  <Typography variant="h6" fontWeight="bold">
                    {c.title}
                  </Typography>
                  <Typography color="text.secondary">{c.subject}</Typography>
                  <Typography sx={{ mt: 1 }}>
                    👨‍🏫 {c.teacher_name} | 💰 {c.price} so‘m
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    📅 {c.start_date}
                  </Typography>
                  <Typography sx={{ mt: 1 }}>{c.description}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      ) : (
        <>
          {/* === Student uchun === */}
          <Typography variant="h4" gutterBottom fontWeight="bold">
            🎓 Mening kurslarim
          </Typography>

          {myCourses.length === 0 ? (
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Siz hali hech qanday kursga qo‘shilmadingiz.
            </Typography>
          ) : (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {myCourses.map((c) => (
                <Grid item xs={12} md={6} key={c.id}>
                  <Card sx={{ p: 3, borderLeft: "6px solid #1976d2" }}>
                    <Typography variant="h6" fontWeight="bold">
                      {c.title}
                    </Typography>
                    <Typography>👨‍🏫 {c.teacher_name}</Typography>
                    <Typography color="text.secondary">
                      {c.subject} | 📅 {c.start_date}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <Divider sx={{ mb: 3 }} />

          {/* === Reklama kurslari === */}
          <Typography variant="h5" gutterBottom>
            📢 Yangi kurslar (reklama)
          </Typography>

          <Grid container spacing={2}>
            {courses.map((c) => (
              <Grid item xs={12} md={6} key={c.id}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {c.title}
                  </Typography>
                  <Typography color="text.secondary">{c.subject}</Typography>
                  <Typography>
                    👨‍🏫 {c.teacher_name} | 💰 {c.price} so‘m
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    📅 {c.start_date}
                  </Typography>
                  <Typography sx={{ mt: 1 }}>{c.description}</Typography>
                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => handleJoinCourse(c.id)}
                    disabled={loading}
                  >
                    {loading ? (
                      <CircularProgress size={22} />
                    ) : (
                      "Kursga qo‘shilish"
                    )}
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
}
