import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { api } from "../services/api";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    course_id: "",
    teacher_id: "",
    student_id: "",
  });

  // -----------------------------
  // FETCH groups + courses
  // -----------------------------
  useEffect(() => {
    fetchGroups();
    fetchCourses();
  }, []);

  const fetchGroups = async () => {
    const res = await api.get("/groups/");
    setGroups(res.data);
  };

  const fetchCourses = async () => {
    const res = await api.get("/groups/courses");
    setCourses(res.data);
  };

  // -----------------------------
  // CHANGE: on course select
  // -----------------------------
  const handleCourseChange = async (courseId) => {
    setFormData({ ...formData, course_id: courseId });

    try {
      const [teachersRes, studentsRes] = await Promise.all([
        api.get(`/groups/teachers/${courseId}`),
        api.get(`/groups/students/${courseId}`),
      ]);

      setTeachers(teachersRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      console.error("Kurs uchun ma’lumotlarni olishda xato:", err);
    }
  };

  // -----------------------------
  // SAVE (create or edit)
  // -----------------------------
  const handleSave = async () => {
    try {
      if (editMode) {
        await api.put(`/groups/${formData.id}`, formData);
      } else {
        await api.post("/groups/", formData);
      }
      setOpen(false);
      fetchGroups();
    } catch (err) {
      console.error("Saqlashda xato:", err.response?.data || err.message);
    }
  };

  // -----------------------------
  // DELETE
  // -----------------------------
  const handleDelete = async (id) => {
    if (window.confirm("Rostdan ham o‘chirasizmi?")) {
      await api.delete(`/groups/${id}`);
      fetchGroups();
    }
  };

  // -----------------------------
  // EDIT / CREATE modal
  // -----------------------------
  const handleEdit = (group) => {
    setFormData(group);
    setEditMode(true);
    setOpen(true);
  };

  const handleCreate = () => {
    setFormData({
      id: null,
      name: "",
      course_id: "",
      teacher_id: "",
      student_id: "",
    });
    setEditMode(false);
    setOpen(true);
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Guruhlar ro‘yxati
      </Typography>

      <Button variant="contained" onClick={handleCreate} sx={{ mb: 2 }}>
        + Yangi guruh
      </Button>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nom</TableCell>
            <TableCell>Kurs</TableCell>
            <TableCell>O‘qituvchi</TableCell>
            <TableCell>Talaba</TableCell>
            <TableCell>Amallar</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.map((g) => (
            <TableRow key={g.id}>
              <TableCell>{g.name}</TableCell>
              <TableCell>{g.course_name}</TableCell>
              <TableCell>{g.teacher_name}</TableCell>
              <TableCell>{g.student_name}</TableCell>
              <TableCell>
                <Button size="small" onClick={() => handleEdit(g)}>
                  Edit
                </Button>
                <Button
                  color="error"
                  size="small"
                  onClick={() => handleDelete(g.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* MODAL */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>
          {editMode ? "Guruhni tahrirlash" : "Yangi guruh yaratish"}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Guruh nomi"
            fullWidth
            margin="normal"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <TextField
            select
            label="Kursni tanlang"
            fullWidth
            margin="normal"
            value={formData.course_id}
            onChange={(e) => handleCourseChange(e.target.value)}
          >
            {courses.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.title}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="O‘qituvchi"
            fullWidth
            margin="normal"
            value={formData.teacher_id}
            onChange={(e) =>
              setFormData({ ...formData, teacher_id: e.target.value })
            }
          >
            {teachers.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.full_name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Talaba"
            fullWidth
            margin="normal"
            value={formData.student_id}
            onChange={(e) =>
              setFormData({ ...formData, student_id: e.target.value })
            }
          >
            {students.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.full_name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Bekor qilish</Button>
          <Button variant="contained" onClick={handleSave}>
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
