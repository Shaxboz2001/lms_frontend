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
  Card,
  CardContent,
} from "@mui/material";
import { api } from "../services/api";
import toast, { Toaster } from "react-hot-toast";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [debts, setDebts] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [filters, setFilters] = useState({
    month: new Date().toISOString().slice(0, 7),
    group: "",
    teacher: "",
  });

  const [stats, setStats] = useState({
    totalPaid: 0,
    totalDebts: 0,
    totalStudents: 0,
    totalGroups: 0,
  });

  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchPayments(),
      fetchGroups(),
      fetchStudents(),
      fetchTeachers(),
      fetchDebts(),
    ]);
  };

  // ==========================
  // API funksiyalar
  // ==========================
  const fetchPayments = async () => {
    try {
      const res = await api.get("/payments");
      setPayments(res.data);
      calculateStats(res.data);
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

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/users");
      setTeachers(res.data.filter((u) => u.role === "teacher"));
    } catch {
      toast.error("O‘qituvchilarni olishda xatolik!");
    }
  };

  // ==========================
  // Statistikalar
  // ==========================
  const calculateStats = (data) => {
    if (!data || data.length === 0) return;
    const totalPaid = data.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalDebts = data
      .filter((p) => p.status !== "paid")
      .reduce((acc, p) => acc + (p.debt_amount || 0), 0);
    const totalStudents = new Set(data.map((p) => p.student_id)).size;
    const totalGroups = new Set(data.map((p) => p.group_id)).size;
    setStats({ totalPaid, totalDebts, totalStudents, totalGroups });
  };

  // ==========================
  // Guruh bo‘yicha filtr
  // ==========================
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

  // ==========================
  // Filtrlangan to‘lovlar
  // ==========================
  const filteredPayments = payments.filter((p) => {
    return (
      (!filters.month || p.month === filters.month) &&
      (!filters.group || p.group_id === filters.group) &&
      (!filters.teacher || p.teacher_id === filters.teacher)
    );
  });

  // ==========================
  // To‘lov qo‘shish
  // ==========================
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
      fetchAllData();
      setConfirmOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "To‘lovni qo‘shishda xatolik!");
    }
  };

  // ==========================
  // Helperlar
  // ==========================
  const getGroupName = (id) => groups.find((g) => g.id === id)?.name || "-";
  const getStudentName = (id) =>
    students.find((s) => s.id === id)?.username || "-";
  const getTeacherName = (id) =>
    teachers.find((t) => t.id === id)?.full_name || "-";

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Toaster position="top-right" />
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        💳 To‘lovlar paneli
      </Typography>

      {/* ========================== Statistikalar ========================== */}
      <Grid container spacing={2} mb={3}>
        {[
          {
            label: "💰 Umumiy tushum",
            value: stats.totalPaid,
            color: "#e8fff3",
          },
          { label: "⚠️ Qarzdorlik", value: stats.totalDebts, color: "#fff6e6" },
          {
            label: "👨‍🎓 O‘quvchilar",
            value: stats.totalStudents,
            color: "#f3f9ff",
          },
          { label: "🏫 Guruhlar", value: stats.totalGroups, color: "#f9f9f9" },
        ].map((item, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ bgcolor: item.color, borderRadius: 3 }}>
              <CardContent>
                <Typography fontWeight={500}>{item.label}</Typography>
                <Typography variant="h6">
                  {item.value.toLocaleString()} {i < 2 ? "so‘m" : ""}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ========================== Filtrlar ========================== */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              label="Oy"
              type="month"
              value={filters.month}
              onChange={(e) =>
                setFilters({ ...filters, month: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel>Guruh</InputLabel>
              <Select
                value={filters.group}
                label="Guruh"
                onChange={(e) =>
                  setFilters({ ...filters, group: e.target.value })
                }
              >
                <MenuItem value="">Barchasi</MenuItem>
                {groups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel>O‘qituvchi</InputLabel>
              <Select
                value={filters.teacher}
                label="O‘qituvchi"
                onChange={(e) =>
                  setFilters({ ...filters, teacher: e.target.value })
                }
              >
                <MenuItem value="">Barchasi</MenuItem>
                {teachers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.full_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={12} md={3}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={fetchAllData}
            >
              Filtrni yangilash
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ========================== To‘lov qo‘shish ========================== */}
      {(role === "teacher" || role === "manager" || role === "admin") && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            ➕ Yangi to‘lov qo‘shish
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Guruh</InputLabel>
                <Select
                  value={selectedGroup}
                  label="Guruh"
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setSelectedGroup(selectedId);
                    const selected = groups.find((g) => g.id === selectedId);
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

            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                fullWidth
                label="Miqdor (so‘m)"
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
                sx={{ height: "100%", fontWeight: 600 }}
                onClick={() => setConfirmOpen(true)}
              >
                Qo‘shish
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* ========================== To‘lovlar jadvali ========================== */}
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 3, minWidth: 800 }}
        >
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
                  <b>O‘qituvchi</b>
                </TableCell>
                <TableCell>
                  <b>Miqdor</b>
                </TableCell>
                <TableCell>
                  <b>Oy</b>
                </TableCell>
                <TableCell>
                  <b>Holat</b>
                </TableCell>
                <TableCell>
                  <b>Sana</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{getStudentName(p.student_id)}</TableCell>
                  <TableCell>{getGroupName(p.group_id)}</TableCell>
                  <TableCell>{getTeacherName(p.teacher_id)}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${p.amount.toLocaleString()} so‘m`}
                      color="success"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{p.month || "-"}</TableCell>
                  <TableCell>
                    {p.status === "paid" ? (
                      <Chip label="To‘langan" color="success" />
                    ) : (
                      <Chip label="To‘lanmagan" color="warning" />
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(p.created_at).toLocaleDateString("uz-UZ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* ========================== Qarzdorlar ========================== */}
      <Typography variant="h6" sx={{ mt: 6, mb: 2 }}>
        💰 Qarzdorlar ro‘yxati
      </Typography>
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 3, minWidth: 800 }}
        >
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
                  sx={{ bgcolor: d.is_overdue ? "#ffebee" : "inherit" }}
                >
                  <TableCell>{getStudentName(d.student_id)}</TableCell>
                  <TableCell>{getGroupName(d.group_id)}</TableCell>
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
      </Box>

      {/* ========================== Tasdiqlash modal ========================== */}
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
