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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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

  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses");
      setCourses(res.data);
    } catch (err) {
      console.error("Fetch courses:", err.response?.data || err.message);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/users");
      setTeachers(res.data.filter((u) => u.role === "teacher"));
    } catch (err) {
      console.error("Fetch teachers:", err.response?.data || err.message);
    }
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
      await api.post("/courses", {
        ...form,
        price: parseFloat(form.price) || 0,
      });
      setMsg({ type: "success", text: "Kurs yaratildi!" });
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
      setMsg({ type: "error", text: "Kurs yaratishda xatolik!" });
      console.error(err);
    }
  };

  const enroll = async (courseId) => {
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setMsg({ type: "success", text: "Kursga yozildingiz!" });
      fetchCourses();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.detail || "Xatolik" });
      console.error(err);
    }
  };

  // teacher uchun faqat o'z kurslarini ko'rsatish toggle variantini xoxlasangiz qo'shing.

  return (
    <Box sx={{ bgcolor: "#f9fafc", p: { xs: 2, md: 4 }, minHeight: "100vh" }}>
      <Typography variant="h4" fontWeight="bold" mb={2}>
        🎓 Kurslarni boshqarish
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* Admin/Manager: Create */}
      {(role === "admin" || role === "manager") && (
        <Card sx={{ mb: 4, p: 2 }}>
          <Typography variant="h6" mb={2}>
            ✨ Yangi kurs yaratish
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Kurs nomi"
                fullWidth
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Fan nomi"
                fullWidth
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="O‘qituvchi"
                fullWidth
                value={form.teacher_id}
                onChange={(e) =>
                  setForm({ ...form, teacher_id: e.target.value })
                }
              >
                {teachers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.full_name || t.username}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Narxi (so'm)"
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
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
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
      )}

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
                <Typography>
                  👨‍🏫{" "}
                  {c.teacher_name || (c.teacher && c.teacher.full_name) || "-"}
                </Typography>
                <Typography>
                  💰 {Number(c.price || 0).toLocaleString()} so‘m
                </Typography>
                <Typography>📅 {c.start_date || "-"}</Typography>
                <Typography sx={{ mt: 1, mb: 1 }}>{c.description}</Typography>

                {/* actions */}
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                  {role === "student" && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => enroll(c.id)}
                    >
                      Enroll
                    </Button>
                  )}
                  {/* teacher can view details, admin/manager can view students */}
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                  >
                    Batafsil
                  </Button>
                </Box>

                {/* Expand: show students (for admin/manager/teacher who is course teacher) */}
                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2">
                      📋 Kurs tafsilotlari
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="subtitle2">
                      Yozilgan talaba(lar):
                    </Typography>
                    <List dense>
                      {c.students && c.students.length > 0 ? (
                        c.students.map((sc) => (
                          // some CourseOut may contain StudentCourse objects; handle both shapes:
                          <ListItem key={sc.id || sc.student_id}>
                            <ListItemText
                              primary={
                                sc.full_name ||
                                sc.username ||
                                (sc.student && sc.student.full_name) ||
                                "-"
                              }
                            />
                          </ListItem>
                        ))
                      ) : (
                        <ListItem>
                          <ListItemText primary="Hozirga qadar talaba yo'q" />
                        </ListItem>
                      )}
                    </List>
                  </AccordionDetails>
                </Accordion>
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
