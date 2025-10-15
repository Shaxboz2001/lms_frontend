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
} from "@mui/material";
import { api } from "../services/api";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedTab, setSelectedTab] = useState("all");
  const [form, setForm] = useState({
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

  // 🔹 Studentlarni olish
  const fetchStudents = async () => {
    try {
      const res = await api.get(`/students`);
      setStudents(res.data);
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // 🔹 Filtrlangan studentlar
  const filteredStudents =
    selectedTab === "all"
      ? students
      : students.filter((s) => s.status === selectedTab);

  // 🔹 Student qo‘shish yoki tahrirlash
  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        role: "student",
      };

      if (editingStudent) {
        await api.put(`/students/${editingStudent.id}`, payload);
      } else {
        await api.post(`/students`, payload);
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
      await api.delete(`/students/${id}`);
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
            {filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.id}</TableCell>
                <TableCell>{student.full_name}</TableCell>
                <TableCell>{student.username}</TableCell>
                <TableCell>{student.phone}</TableCell>
                <TableCell>{student.subject}</TableCell>
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
    </Box>
  );
};

export default Students;
