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
import toast, { Toaster } from "react-hot-toast";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // ✅ Delete confirmation modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    course_id: "",
    teacher_id: "",
    student_ids: [],
  });

  // -----------------------------
  // FETCH groups + courses
  // -----------------------------
  useEffect(() => {
    fetchGroups();
    fetchCourses();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups/");
      setGroups(res.data);
    } catch {
      toast.error("Guruhlarni olishda xatolik yuz berdi");
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get("/groups/courses");
      setCourses(res.data);
    } catch {
      toast.error("Kurslarni olishda xatolik yuz berdi");
    }
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
    } catch {
      toast.error("Kurs uchun ma’lumotlarni olishda xato");
    }
  };

  // -----------------------------
  // SAVE (create or edit)
  // -----------------------------
  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        teacher_id: Number(formData.teacher_id),
        student_ids: formData.student_ids.map(Number),
      };

      if (editMode) {
        await api.put(`/groups/${formData.id}`, payload);
        toast.success("Guruh muvaffaqiyatli yangilandi ✅");
      } else {
        await api.post("/groups/", payload);
        toast.success("Yangi guruh yaratildi ✅");
      }

      setOpen(false);
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Saqlashda xato");
    }
  };

  // -----------------------------
  // DELETE
  // -----------------------------
  const confirmDelete = (groupId) => {
    setDeleteTarget(groupId);
    setConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await api.delete(`/groups/${deleteTarget}`);
      toast.success("Guruh o‘chirildi 🗑️");
      fetchGroups();
    } catch (err) {
      toast.error(
        err.response?.data?.detail || "Guruhni o‘chirishda xatolik yuz berdi"
      );
    } finally {
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  // -----------------------------
  // EDIT / CREATE modal
  // -----------------------------
  const handleEdit = (group) => {
    setFormData({
      id: group.id,
      name: group.name,
      course_id: group.course_id,
      teacher_id: group.teacher_id || "",
      student_ids: group.students?.map((s) => s.id) || [],
    });
    setEditMode(true);
    setOpen(true);
  };

  const handleCreate = () => {
    setFormData({
      id: null,
      name: "",
      course_id: "",
      teacher_id: "",
      student_ids: [],
    });
    setEditMode(false);
    setOpen(true);
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <Box sx={{ p: 3 }}>
      <Toaster position="top-right" />

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
            <TableCell>Talabalar</TableCell>
            <TableCell>Amallar</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.map((g) => (
            <TableRow key={g.id}>
              <TableCell>{g.name}</TableCell>
              <TableCell>{g.course?.title || "-"}</TableCell>
              <TableCell>{g.teacher?.full_name || "-"}</TableCell>
              <TableCell>
                {g.students?.map((s) => s.full_name).join(", ") || "-"}
              </TableCell>
              <TableCell>
                <Button size="small" onClick={() => handleEdit(g)}>
                  Edit
                </Button>
                <Button
                  color="error"
                  size="small"
                  onClick={() => confirmDelete(g.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* MODAL: CREATE/EDIT */}
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
            label="Talabalar"
            fullWidth
            margin="normal"
            SelectProps={{ multiple: true }}
            value={formData.student_ids}
            onChange={(e) =>
              setFormData({
                ...formData,
                student_ids: e.target.value,
              })
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

      {/* MODAL: DELETE CONFIRMATION */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>O‘chirishni tasdiqlang</DialogTitle>
        <DialogContent>
          <Typography>
            Ushbu guruhni o‘chirishni istaysizmi? Amalni qaytarib bo‘lmaydi.
          </Typography>
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
}
