import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid,
  Chip,
} from "@mui/material";
import { api } from "../services/api";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchPayments();
    fetchGroups();
    fetchStudents();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get("/payments");
      setPayments(res.data);
    } catch (err) {
      console.error("Payment fetch error:", err.response?.data || err.message);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(res.data);
    } catch (err) {
      console.error("Groups fetch error:", err.response?.data || err.message);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get("/users");
      setStudents(res.data.filter((u) => u.role === "student"));
    } catch (err) {
      console.error("Students fetch error:", err.response?.data || err.message);
    }
  };

  // Guruh tanlanganda avtomatik o‘sha guruhdagi studentlarni chiqarish
  const handleGroupChange = (groupId) => {
    setSelectedGroup(groupId);
    if (groupId) {
      const filtered = students.filter((s) => s.group_id === groupId);
      setFilteredStudents(filtered);
      setSelectedStudent("");
    } else {
      setFilteredStudents([]);
    }
  };

  const addPayment = async () => {
    if (!selectedGroup || !selectedStudent || !amount) {
      alert("Iltimos, barcha maydonlarni to‘ldiring!");
      return;
    }

    try {
      await api.post("/payments", {
        amount: parseFloat(amount),
        description,
        student_id: parseInt(selectedStudent),
        group_id: parseInt(selectedGroup),
        teacher_id: role === "teacher" ? parseInt(userId) : null,
        month: selectedMonth,
      });

      setAmount("");
      setDescription("");
      setSelectedStudent("");
      setSelectedGroup("");
      setSelectedMonth(new Date().toISOString().slice(0, 7));
      setFilteredStudents([]);
      fetchPayments();
    } catch (err) {
      console.error("Payment add error:", err.response?.data || err.message);
    }
  };

  const getGroupName = (id) => groups.find((g) => g.id === id)?.name || "-";
  const getStudentName = (id) =>
    students.find((s) => s.id === id)?.username || "-";

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        💳 To‘lovlar
      </Typography>

      {(role === "teacher" || role === "manager" || role === "admin") && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.5} sx={{ minWidth: "50px" }}>
              <FormControl fullWidth>
                <InputLabel>Guruh</InputLabel>
                <Select
                  value={selectedGroup}
                  label="Guruh"
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setSelectedGroup(selectedId);

                    // Tanlangan guruhni topamiz
                    const selected = groups.find(
                      (group) => group.id === selectedId
                    );

                    // Agar topilsa, uning fee qiymatini to‘lov summasiga o‘rnatamiz
                    if (selected) {
                      setAmount(selected.fee);
                    }

                    // Keyingi amallar uchun (masalan, studentlarni chiqarish)
                    handleGroupChange(selectedId);
                  }}
                >
                  {groups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                fullWidth
                label="Miqdor"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Tavsif"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2.5} sx={{ minWidth: "50px" }}>
              <FormControl fullWidth disabled={!filteredStudents.length}>
                <InputLabel>Student</InputLabel>
                <Select
                  value={selectedStudent}
                  label="Student"
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  {filteredStudents.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Oy"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={1.5}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                sx={{ height: "100%" }}
                onClick={addPayment}
              >
                Qo‘shish
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* 🔹 To‘lovlar jadvali */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <b>ID</b>
              </TableCell>
              <TableCell>
                <b>Student</b>
              </TableCell>
              <TableCell>
                <b>Guruh</b>
              </TableCell>
              <TableCell>
                <b>Miqdor</b>
              </TableCell>
              <TableCell>
                <b>Oy</b>
              </TableCell>
              <TableCell>
                <b>Tavsif</b>
              </TableCell>
              <TableCell>
                <b>Sana</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell>{getStudentName(p.student_id)}</TableCell>
                <TableCell>{getGroupName(p.group_id)}</TableCell>
                <TableCell>
                  <Chip
                    label={`${p.amount} so'm`}
                    color="success"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{p.month || "-"}</TableCell>
                <TableCell>{p.description || "-"}</TableCell>
                <TableCell>
                  {new Date(p.created_at).toLocaleDateString("uz-UZ")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {payments.length === 0 && (
        <Typography
          variant="body2"
          sx={{ mt: 2, textAlign: "center", color: "gray" }}
        >
          Hozircha hech qanday to‘lov mavjud emas.
        </Typography>
      )}
    </Box>
  );
};

export default Payments;
