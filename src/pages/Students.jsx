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
} from "@mui/material";
import axios from "axios";
import { BASE_URL, config } from "../services/api";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    phone: "",
    address: "",
    subject: "",
    fee: "",
    age: "",
    password: "1234", // default password
    status: "interested",
  });

  // 🔹 Studentlarni olish
  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/students`, config);
      setStudents(res.data);
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // 🔹 Student qo‘shish yoki tahrirlash
  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        role: "student", // backendda role student bo‘ladi
      };

      if (editingStudent) {
        await axios.put(
          `${BASE_URL}/students/${editingStudent.id}`,
          payload,
          config
        );
      } else {
        await axios.post(`${BASE_URL}/students`, payload, config);
      }
      fetchStudents();
      handleClose();
    } catch (err) {
      console.error("Save error:", err.response?.data || err.message);
    }
  };

  // 🔹 O‘chirish
  const handleDelete = async (id) => {
    if (!window.confirm("Haqiqatan ham o‘chirmoqchimisiz?")) return;
    try {
      await axios.delete(`${BASE_URL}/students/${id}`, config);
      fetchStudents();
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
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
        subject: student.subject || "",
        fee: student.fee || "",
        age: student.age || "",
        password: student.password || "1234",
        status: student.status || "interested",
      });
    } else {
      setEditingStudent(null);
      setForm({
        username: "",
        full_name: "",
        phone: "",
        address: "",
        subject: "",
        fee: "",
        age: "",
        password: "1234",
        status: "interested",
      });
    }
    setOpen(true);
  };

  // 🔹 Yopish
  const handleClose = () => {
    setOpen(false);
    setEditingStudent(null);
  };

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        🎓 Studentlar ro‘yxati
      </Typography>

      <Button variant="contained" color="primary" onClick={() => handleOpen()}>
        ➕ Student qo‘shish
      </Button>

      <Paper sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Ism Familiya</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Telefon</TableCell>
              <TableCell>Fan</TableCell>
              <TableCell>To‘lov</TableCell>
              <TableCell>Yosh</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Amallar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.id}</TableCell>
                <TableCell>{student.full_name}</TableCell>
                <TableCell>{student.username}</TableCell>
                <TableCell>{student.phone}</TableCell>
                <TableCell>{student.subject}</TableCell>
                <TableCell>{student.fee}</TableCell>
                <TableCell>{student.age}</TableCell>
                <TableCell>{student.status}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    color="info"
                    variant="outlined"
                    onClick={() => handleOpen(student)}
                    sx={{ mr: 1 }}
                  >
                    ✏️ Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => handleDelete(student.id)}
                  >
                    🗑️ Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
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
          <TextField
            label="Subject"
            fullWidth
            sx={{ mt: 2 }}
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <TextField
            label="Fee"
            fullWidth
            sx={{ mt: 2 }}
            value={form.fee}
            onChange={(e) => setForm({ ...form, fee: e.target.value })}
          />
          <TextField
            label="Age"
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
              <MenuItem value="interested">Interested</MenuItem>
              <MenuItem value="studying">Studying</MenuItem>
              <MenuItem value="left">Left</MenuItem>
              <MenuItem value="graduated">Graduated</MenuItem>
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
    </Box>
  );
};

export default Students;
