import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Stack,
} from "@mui/material";
import { api } from "../services/api";

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    student_ids: [],
    teacher_ids: [],
  });

  // ---------------------------
  // Fetch Users (students & teachers)
  // ---------------------------
  const fetchUsers = async () => {
    try {
      const res = await api.get("/users/");
      const all = res.data;
      setStudents(all.filter((u) => u.role === "student"));
      setTeachers(all.filter((u) => u.role === "teacher"));
    } catch (err) {
      console.error("Users fetch error:", err);
    }
  };

  // ---------------------------
  // Fetch Groups
  // ---------------------------
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get("/groups/");
      setGroups(res.data);
    } catch (err) {
      console.error("Groups fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  // ---------------------------
  // Create Group
  // ---------------------------
  const handleCreate = async () => {
    if (!form.name) {
      alert("Guruh nomini kiriting!");
      return;
    }

    try {
      await api.post("/groups/", form);
      setForm({
        name: "",
        description: "",
        student_ids: [],
        teacher_ids: [],
      });
      fetchGroups();
    } catch (err) {
      console.error("Create error:", err);
      alert(err.response?.data?.detail || "Xatolik yuz berdi!");
    }
  };

  // ---------------------------
  // Delete Group
  // ---------------------------
  const handleDelete = async (id) => {
    if (!window.confirm("Rostdan ham o‘chirmoqchimisiz?")) return;

    try {
      await api.delete(`/groups/${id}`);
      fetchGroups();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.detail || "O‘chirishda xatolik!");
    }
  };

  // ---------------------------
  // Helpers
  // ---------------------------
  const getStudentNames = (group) =>
    group.students?.map((s) => s.full_name || s.username).join(", ") || "-";

  const getTeacherNames = (group) =>
    group.teachers?.map((t) => t.full_name || t.username).join(", ") || "-";

  // ---------------------------
  // Render
  // ---------------------------
  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "70vh",
        }}
      >
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        📘 Guruhlar boshqaruvi
      </Typography>

      {/* Yangi guruh yaratish */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" mb={2}>
          ➕ Yangi guruh yaratish
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Guruh nomi"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
          />

          <TextField
            label="Tavsif (ixtiyoriy)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            fullWidth
            multiline
            rows={2}
          />

          <FormControl fullWidth>
            <InputLabel>O‘qituvchilar</InputLabel>
            <Select
              multiple
              value={form.teacher_ids}
              onChange={(e) =>
                setForm({ ...form, teacher_ids: e.target.value })
              }
              renderValue={(selected) =>
                selected
                  .map((id) => teachers.find((t) => t.id === id)?.full_name)
                  .join(", ")
              }
            >
              {teachers.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.full_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Talabalar</InputLabel>
            <Select
              multiple
              value={form.student_ids}
              onChange={(e) =>
                setForm({ ...form, student_ids: e.target.value })
              }
              renderValue={(selected) =>
                selected
                  .map((id) => students.find((s) => s.id === id)?.full_name)
                  .join(", ")
              }
            >
              {students.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.full_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button variant="contained" onClick={handleCreate}>
            Saqlash
          </Button>
        </Stack>
      </Paper>

      {/* Guruhlar jadvali */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>
          📋 Guruhlar ro‘yxati
        </Typography>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nomi</TableCell>
              <TableCell>O‘qituvchilar</TableCell>
              <TableCell>Talabalar</TableCell>
              <TableCell>Tavsif</TableCell>
              <TableCell>Amallar</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {groups.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Guruhlar mavjud emas
                </TableCell>
              </TableRow>
            )}

            {groups.map((g) => (
              <TableRow key={g.id}>
                <TableCell>{g.id}</TableCell>
                <TableCell>{g.name}</TableCell>
                <TableCell>
                  {g.teachers?.length > 0
                    ? g.teachers.map((t) => (
                        <Chip
                          key={t.id}
                          label={t.full_name || t.username}
                          color="primary"
                          size="small"
                          sx={{ mr: 0.5 }}
                        />
                      ))
                    : "-"}
                </TableCell>
                <TableCell>
                  {g.students?.length > 0
                    ? g.students.map((s) => (
                        <Chip
                          key={s.id}
                          label={s.full_name || s.username}
                          color="secondary"
                          size="small"
                          sx={{ mr: 0.5 }}
                        />
                      ))
                    : "-"}
                </TableCell>
                <TableCell>{g.description || "-"}</TableCell>
                <TableCell>
                  <Button
                    color="error"
                    size="small"
                    onClick={() => handleDelete(g.id)}
                  >
                    O‘chirish
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Groups;
