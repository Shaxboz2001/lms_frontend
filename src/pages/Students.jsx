import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Tabs,
  Tab,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../services/api";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedTab, setSelectedTab] = useState("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    username: "",
    full_name: "",
    phone: "",
    address: "",
    course_id: "",
    fee: "",
    age: "",
    password: "1234",
    status: "interested",
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // 🔹 Studentlarni olish
  const fetchStudents = async () => {
    try {
      const res = await api.get(`/students`);
      setStudents(res.data);
    } catch (err) {
      toast.error("Studentlarni olishda xato!");
      console.error(err);
    }
  };

  // 🔹 Kurslarni olish
  const fetchCourses = async () => {
    try {
      const res = await api.get(`/courses`);
      setCourses(res.data);
    } catch (err) {
      toast.error("Kurslarni olishda xato!");
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  // 🔹 Course tanlanganda fee avtomatik to‘ldiriladi
  const handleCourseChange = (e) => {
    const courseId = Number(e.target.value);
    const selectedCourse = courses.find((c) => c.id === courseId);
    setForm({
      ...form,
      course_id: courseId,
      fee: selectedCourse ? selectedCourse.price : "",
    });
  };

  // 🔹 Filtrlangan studentlar
  const filteredStudents =
    selectedTab === "all"
      ? students
      : students.filter((s) => s.status === selectedTab);

  // 🔹 Saqlash (create/update)
  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        role: "student",
      };

      if (editingStudent) {
        await api.put(`/students/${editingStudent.id}`, payload);
        toast.success("Student yangilandi ✅");
      } else {
        await api.post(`/students`, payload);
        toast.success("Yangi student qo‘shildi ✅");
      }

      fetchStudents();
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Saqlashda xato!");
    }
  };

  // 🔹 O‘chirishni tasdiqlash oynasi
  const confirmDelete = (id) => {
    setDeleteTarget(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await api.delete(`/students/${deleteTarget}`);
      toast.success("Student o‘chirildi 🗑️");
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.detail || "O‘chirishda xato!");
    } finally {
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  // 🔹 Forma ochish
  const handleOpen = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setForm({
        username: student.username || "",
        full_name: student.full_name || "",
        phone: student.phone || "",
        address: student.address || "",
        course_id: student.course_id || "",
        fee: student.fee || "",
        age: student.age || "",
        password: "1234",
        status: student.status || "interested",
      });
    } else {
      setEditingStudent(null);
      setForm({
        username: "",
        full_name: "",
        phone: "",
        address: "",
        course_id: "",
        fee: "",
        age: "",
        password: "1234",
        status: "interested",
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingStudent(null);
  };

  return (
    <Box p={isMobile ? 1.5 : 3}>
      <Toaster position="top-right" />
      <Typography variant="h5" mb={2} fontWeight={600}>
        🎓 Studentlar ro‘yxati
      </Typography>

      {/* 🔹 Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={selectedTab}
          onChange={(e, v) => setSelectedTab(v)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Hammasi" value="all" />
          <Tab label="Lidlar" value="interested" />
          <Tab label="Faollar" value="studying" />
          <Tab label="Ketganlar" value="left" />
          <Tab label="Bitirganlar" value="graduated" />
        </Tabs>
      </Paper>

      <Button
        variant="contained"
        color="primary"
        onClick={() => handleOpen()}
        sx={{ mb: 2 }}
      >
        ➕ Student qo‘shish
      </Button>

      {/* 🔹 Jadval */}
      <Paper sx={{ width: "100%", overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Ism Familiya</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Telefon</TableCell>
              <TableCell>Kurs</TableCell>
              <TableCell>To‘lov</TableCell>
              <TableCell>Yosh</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Amallar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id} hover>
                <TableCell>{student.id}</TableCell>
                <TableCell>{student.full_name}</TableCell>
                <TableCell>{student.username}</TableCell>
                <TableCell>{student.phone}</TableCell>
                <TableCell>{student.course?.title || "—"}</TableCell>
                <TableCell>{student.fee}</TableCell>
                <TableCell>{student.age}</TableCell>
                <TableCell>
                  {student.status === "interested"
                    ? "Lid"
                    : student.status === "studying"
                    ? "Faol"
                    : student.status === "left"
                    ? "Ketgan"
                    : "Bitirgan"}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    color="info"
                    variant="outlined"
                    onClick={() => handleOpen(student)}
                    sx={{ mr: 1 }}
                  >
                    ✏️
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => confirmDelete(student.id)}
                  >
                    🗑️
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {filteredStudents.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  Hech qanday student topilmadi
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* 🔹 Modal: Add/Edit */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingStudent
            ? "✏️ Studentni tahrirlash"
            : "➕ Yangi student qo‘shish"}
        </DialogTitle>

        <DialogContent>
          <TextField
            label="Full Name"
            fullWidth
            sx={{ mt: 2 }}
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <TextField
            label="Username"
            fullWidth
            sx={{ mt: 2 }}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            sx={{ mt: 2 }}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <TextField
            label="Phone"
            fullWidth
            sx={{ mt: 2 }}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <TextField
            label="Address"
            fullWidth
            sx={{ mt: 2 }}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Kurs</InputLabel>
            <Select
              value={form.course_id}
              label="Kurs"
              onChange={handleCourseChange}
            >
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="To‘lov (so‘m)"
            fullWidth
            sx={{ mt: 2 }}
            value={form.fee}
            onChange={(e) => setForm({ ...form, fee: e.target.value })}
          />

          <TextField
            label="Yosh"
            fullWidth
            type="number"
            sx={{ mt: 2 }}
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
          />

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <MenuItem value="interested">Lid</MenuItem>
              <MenuItem value="studying">Faol</MenuItem>
              <MenuItem value="left">Ketgan</MenuItem>
              <MenuItem value="graduated">Bitirgan</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Bekor qilish</Button>
          <Button variant="contained" onClick={handleSave}>
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🔹 Delete tasdiqlash oynasi */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Studentni o‘chirish</DialogTitle>
        <DialogContent>
          <Typography>Ushbu studentni o‘chirishni istaysizmi?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Bekor qilish</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirmed}
          >
            O‘chirish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Students;
