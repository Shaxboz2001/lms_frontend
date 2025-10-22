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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { api } from "../services/api";
import toast, { Toaster } from "react-hot-toast";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [debts, setDebts] = useState([]);
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

  const [confirmOpen, setConfirmOpen] = useState(false);

  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchPayments();
    fetchGroups();
    fetchStudents();
    fetchDebts();
  }, []);

  // ============================
  // Fetch funksiyalar
  // ============================
  const fetchPayments = async () => {
    try {
      const res = await api.get("/payments");
      setPayments(res.data);
    } catch {
      toast.error("To‘lovlarni olishda xatolik!");
    }
  };

  const fetchDebts = async () => {
    try {
      const res = await api.get("/payments/debts");
      setDebts(res.data);
    } catch {
      toast.error("Qarzdorliklarni olishda xatolik!");
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(res.data);
    } catch {
      toast.error("Guruhlarni olishda xatolik!");
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get("/users");
      setStudents(res.data.filter((u) => u.role === "student"));
    } catch {
      toast.error("Studentlarni olishda xatolik!");
    }
  };

  // ============================
  // Guruh bo‘yicha filtr
  // ============================
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

  // ============================
  // To‘lov qo‘shish
  // ============================
  const handleAddPayment = async () => {
    if (!selectedGroup || !selectedStudent || !amount) {
      toast.error("Barcha maydonlarni to‘ldiring!");
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

      toast.success("To‘lov muvaffaqiyatli qo‘shildi ✅");
      setAmount("");
      setDescription("");
      setSelectedStudent("");
      setSelectedGroup("");
      setSelectedMonth(new Date().toISOString().slice(0, 7));
      setFilteredStudents([]);

      fetchPayments();
      fetchDebts();
      setConfirmOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "To‘lovni qo‘shishda xatolik!");
    }
  };

  // ============================
  // Helper funksiyalar
  // ============================
  const getGroupName = (id) => groups.find((g) => g.id === id)?.name || "-";
  const getStudentName = (id) =>
    students.find((s) => s.id === id)?.username || "-";

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Toaster position="top-right" />

      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        💳 To‘lovlar
      </Typography>

      {/* ============================
          🔹 To‘lov qo‘shish formasi
      ============================ */}
      {(role === "teacher" || role === "manager" || role === "admin") && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            boxShadow: 3,
          }}
        >
          <Grid container spacing={2}>
            {/* Guruh tanlash */}
            <Grid item xs={12} sm={6} md={2.5}>
              <FormControl fullWidth>
                <InputLabel>Guruh</InputLabel>
                <Select
                  value={selectedGroup}
                  label="Guruh"
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setSelectedGroup(selectedId);
                    const selected = groups.find(
                      (group) => group.id === selectedId
                    );
                    if (selected) setAmount(selected.fee || "");
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

            {/* Miqdor */}
            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                fullWidth
                label="Miqdor (so‘m)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Grid>

            {/* Tavsif */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Tavsif"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>

            {/* Student tanlash */}
            <Grid item xs={12} sm={6} md={2.5}>
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

            {/* Oy */}
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Oy"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </Grid>

            {/* Qo‘shish tugmasi */}
            <Grid item xs={12} md={1.5}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                sx={{ height: "100%", fontWeight: 600 }}
                onClick={() => setConfirmOpen(true)}
              >
                Qo‘shish
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* ============================
          📊 To‘lovlar jadvali
      ============================ */}
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
                    label={`${p.amount} so‘m`}
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

      {/* ============================
          💰 Qarzdorlar jadvali
      ============================ */}
      <Typography variant="h6" sx={{ mt: 6, mb: 2 }}>
        💰 Qarzdorlar ro‘yxati
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <b>Student</b>
              </TableCell>
              <TableCell>
                <b>Guruh</b>
              </TableCell>
              <TableCell>
                <b>To‘lanishi kerak</b>
              </TableCell>
              <TableCell>
                <b>Qarzdorlik</b>
              </TableCell>
              <TableCell>
                <b>To‘lov muddati</b>
              </TableCell>
              <TableCell>
                <b>Holat</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {debts.map((d) => (
              <TableRow
                key={d.id}
                sx={{
                  bgcolor: d.is_overdue ? "#ffebee" : "inherit",
                }}
              >
                <TableCell>{getStudentName(d.student_id)}</TableCell>
                <TableCell>{getGroupName(d.group_id)}</TableCell>
                <TableCell>{d.total_due || 0} so‘m</TableCell>
                <TableCell>
                  <Chip
                    label={`${d.debt_amount || 0} so‘m`}
                    color={d.is_overdue ? "error" : "warning"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{d.due_date || "-"}</TableCell>
                <TableCell>
                  {d.is_overdue ? "Muddat o‘tgan" : "To‘lanmagan"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {debts.length === 0 && (
        <Typography
          variant="body2"
          sx={{ mt: 2, textAlign: "center", color: "gray" }}
        >
          Hech qanday qarzdorlik topilmadi.
        </Typography>
      )}

      {/* ============================
          🧾 Tasdiqlash modal
      ============================ */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>To‘lovni qo‘shish</DialogTitle>
        <DialogContent>
          <Typography>
            <b>{getStudentName(selectedStudent)}</b> uchun <b>{amount} so‘m</b>{" "}
            to‘lovni kiritmoqchimisiz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Bekor qilish</Button>
          <Button variant="contained" onClick={handleAddPayment}>
            Tasdiqlash
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payments;
