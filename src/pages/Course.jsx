// src/pages/Courses.jsx
import React, { useEffect, useState } from "react";
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
  MenuItem,
} from "@mui/material";
import { api } from "../services/api";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    teacher_id: "",
    description: "",
    start_date: "",
    price: "",
  });
  const [msg, setMsg] = useState({ type: "", text: "" });

  const fetchCourses = async () => {
    const res = await api.get(`courses/`);
    setCourses(res.data);
  };

  const fetchTeachers = async () => {
    const res = await api.get(`/users`);
    setTeachers(res.data.filter((u) => u.role === "teacher"));
  };

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.teacher_id || !form.start_date) {
      setMsg({
        type: "error",
        text: "Iltimos, barcha majburiy maydonlarni to‘ldiring!",
      });
      return;
    }
    try {
      await api.post(`/courses/`, {
        ...form,
        price: parseFloat(form.price) || 0,
      });
      setMsg({ type: "success", text: "Kurs muvaffaqiyatli yaratildi!" });
      setForm({
        title: "",
        subject: "",
        teacher_id: "",
        description: "",
        start_date: "",
        price: "",
      });
      fetchCourses();
    } catch (err) {
      setMsg({ type: "error", text: "Kurs yaratishda xatolik yuz berdi!" });
    }
  };

  return (
    <Box sx={{ bgcolor: "#f9fafc", p: { xs: 2, md: 4 }, minHeight: "100vh" }}>
      <Typography variant="h4" fontWeight="bold" mb={2}>
        🎓 Kurslarni boshqarish
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Card sx={{ mb: 4, p: 2 }}>
        <Typography variant="h6" mb={2}>
          ✨ Yangi kurs yaratish
        </Typography>
        <Grid container spacing={2}>
          {["title", "subject"].map((f) => (
            <Grid item xs={12} md={6} key={f}>
              <TextField
                label={f === "title" ? "Kurs nomi" : "Fan nomi"}
                fullWidth
                value={form[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              />
            </Grid>
          ))}
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="O‘qituvchi"
              fullWidth
              value={form.teacher_id}
              onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
            >
              {teachers.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.full_name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Narxi (so‘m)"
              type="number"
              fullWidth
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Boshlanish sanasi"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Tavsif"
              fullWidth
              multiline
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} textAlign="right">
            <Button variant="contained" onClick={handleSubmit}>
              💾 Kursni qo‘shish
            </Button>
          </Grid>
        </Grid>
      </Card>

      <Typography variant="h5" mb={2}>
        📚 Mavjud kurslar
      </Typography>
      <Grid container spacing={3}>
        {courses.map((c) => (
          <Grid item xs={12} md={6} lg={4} key={c.id}>
            <Card sx={{ p: 2, borderLeft: "6px solid #1976d2" }}>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {c.title}
                </Typography>
                <Typography>👨‍🏫 {c.teacher_name}</Typography>
                <Typography>💰 {c.price?.toLocaleString()} so‘m</Typography>
                <Typography>📅 {c.start_date}</Typography>
                <Typography sx={{ mt: 1 }}>{c.description}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={!!msg.text}
        autoHideDuration={3000}
        onClose={() => setMsg({ type: "", text: "" })}
      >
        <Alert severity={msg.type}>{msg.text}</Alert>
      </Snackbar>
    </Box>
  );
}
