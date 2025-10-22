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
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { api } from "../services/api";
import toast, { Toaster } from "react-hot-toast";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [form, setForm] = useState({
    title: "",
    subject: "",
    teacher_id: "",
    description: "",
    start_date: "",
    price: "",
  });

  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  // 🔹 Kurslarni olish
  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses");
      setCourses(res.data);
    } catch (err) {
      toast.error("Kurslarni olishda xatolik!");
    }
  };

  // 🔹 Foydalanuvchiga tegishli kurslarni olish
  const fetchMyCourses = async () => {
    try {
      let res;
      if (role === "teacher") {
        res = await api.get(`/courses/teacher/${userId}`);
      } else if (role === "student") {
        res = await api.get(`/courses/student/${userId}`);
      }
      setMyCourses(res?.data || []);
    } catch (err) {
      toast.error("Mening kurslarimni olishda xatolik!");
    }
  };

  // 🔹 O‘qituvchilarni olish
  const fetchTeachers = async () => {
    try {
      const res = await api.get("/users");
      setTeachers(res.data.filter((u) => u.role === "teacher"));
    } catch {
      toast.error("O‘qituvchilarni olishda xatolik!");
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
    if (role === "teacher" || role === "student") {
      fetchMyCourses();
    }
  }, [role]);

  // 🔹 Kurs yaratish
  const handleSubmit = async () => {
    if (!form.title || !form.teacher_id || !form.start_date) {
      toast.error("Iltimos, majburiy maydonlarni to‘ldiring!");
      return;
    }

    try {
      await api.post("/courses", {
        ...form,
        price: parseFloat(form.price) || 0,
      });
      toast.success("Kurs yaratildi ✅");
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
      toast.error(err.response?.data?.detail || "Kurs yaratishda xatolik!");
    }
  };

  // 🔹 Kursga yozilish
  const enroll = async (courseId) => {
    try {
      await api.post(`/courses/${courseId}/enroll`);
      toast.success("Kursga yozildingiz ✅");
      fetchCourses();
      fetchMyCourses();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xatolik yuz berdi!");
    }
  };

  // 🔹 Kursni o‘chirish (faqat admin/manager)
  const handleDelete = async () => {
    try {
      await api.delete(`/courses/${selectedCourse.id}`);
      toast.success("Kurs o‘chirildi 🗑️");
      fetchCourses();
      setConfirmOpen(false);
      setSelectedCourse(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "O‘chirishda xatolik!");
    }
  };

  return (
    <Box sx={{ bgcolor: "#f9fafc", p: { xs: 2, md: 4 }, minHeight: "100vh" }}>
      <Toaster position="top-right" />

      <Typography variant="h4" fontWeight="bold" mb={2}>
        🎓 Kurslar
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* ================================
          👨‍🏫 Mening kurslarim (teacher/student)
      ================================= */}
      {(role === "teacher" || role === "student") && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            📘 Mening kurslarim
          </Typography>

          {myCourses.length === 0 ? (
            <Typography color="text.secondary">
              Sizda hozircha kurslar mavjud emas.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {myCourses.map((c) => (
                <Grid item xs={12} md={6} lg={4} key={c.id}>
                  <Card
                    sx={{
                      p: 2,
                      borderLeft: "6px solid #1976d2",
                      bgcolor: "#fff",
                      "&:hover": { boxShadow: 3 },
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" color="primary">
                        {c.title}
                      </Typography>
                      <Typography>
                        👨‍🏫 {c.teacher_name || c.teacher?.full_name || "-"}
                      </Typography>
                      <Typography>
                        💰 {Number(c.price || 0).toLocaleString()} so‘m
                      </Typography>
                      <Typography>📅 {c.start_date || "-"}</Typography>
                      <Typography sx={{ mt: 1 }}>{c.description}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          <Divider sx={{ my: 4 }} />
        </Box>
      )}

      {/* ================================
          👑 Admin / Manager: Kurs yaratish
      ================================= */}
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

      {/* ================================
          📚 Barcha kurslar ro‘yxati
      ================================= */}
      <Typography variant="h5" mb={2}>
        📚 Mavjud kurslar
      </Typography>
      <Grid container spacing={3}>
        {courses.map((c) => (
          <Grid item xs={12} md={6} lg={4} key={c.id}>
            <Card
              sx={{
                p: 2,
                borderLeft: "6px solid #1976d2",
                bgcolor: "#fff",
                "&:hover": { boxShadow: 3 },
              }}
            >
              <CardContent>
                <Typography variant="h6" color="primary">
                  {c.title}
                </Typography>
                <Typography>
                  👨‍🏫 {c.teacher_name || c.teacher?.full_name || "-"}
                </Typography>
                <Typography>
                  💰 {Number(c.price || 0).toLocaleString()} so‘m
                </Typography>
                <Typography>📅 {c.start_date || "-"}</Typography>
                <Typography sx={{ mt: 1, mb: 1 }}>{c.description}</Typography>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                  {role === "student" && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => enroll(c.id)}
                    >
                      ✏️ Kursga yozilish
                    </Button>
                  )}
                  {(role === "admin" || role === "manager") && (
                    <Button
                      color="error"
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSelectedCourse(c);
                        setConfirmOpen(true);
                      }}
                    >
                      🗑️ O‘chirish
                    </Button>
                  )}
                </Box>

                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2">
                      📋 Kurs tafsilotlari
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="subtitle2">
                      Yozilgan talabalar:
                    </Typography>
                    <List dense>
                      {c.students && c.students.length > 0 ? (
                        c.students.map((sc) => (
                          <ListItem key={sc.id || sc.student_id}>
                            <ListItemText
                              primary={
                                sc.full_name ||
                                sc.username ||
                                sc.student?.full_name ||
                                "-"
                              }
                            />
                          </ListItem>
                        ))
                      ) : (
                        <ListItem>
                          <ListItemText primary="Hozircha talaba yo‘q" />
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

      {/* 🔹 Kursni o‘chirishni tasdiqlash oynasi */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Kursni o‘chirish</DialogTitle>
        <DialogContent>
          <Typography>
            “{selectedCourse?.title}” kursini o‘chirishni istaysizmi?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Bekor qilish</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            O‘chirish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
