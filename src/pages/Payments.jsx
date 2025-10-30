import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Chip,
  Modal,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
  Divider,
} from "@mui/material";
import { Add, Refresh, FilterAlt, Sort } from "@mui/icons-material";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../services/api";

const monthNames = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

const formatMonth = (yyyyMm) => {
  if (!yyyyMm) return "-";
  const [y, m] = yyyyMm.split("-");
  return `${monthNames[parseInt(m) - 1]} ${y}`;
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState(null);

  // yangi to‘lov form
  const [form, setForm] = useState({
    group_id: "",
    month: new Date().toISOString().slice(0, 7),
    amount: "",
    description: "",
  });

  const [availableGroups, setAvailableGroups] = useState([]);

  // === yangi filter va sort parametrlari ===
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  // ==================== Fetch data ====================
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/payments");
      setPayments(res.data || []);
    } catch {
      toast.error("To‘lovlarni olishda xato!");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get("/users");
      setStudents(res.data.filter((u) => u.role === "student"));
    } catch {
      toast.error("O‘quvchilar olinmadi!");
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(res.data);
    } catch {
      toast.error("Guruhlar olinmadi!");
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStudents();
    fetchGroups();
  }, []);

  // ==================== Talaba tarixi ochish ====================
  const openHistory = async (student) => {
    setSelectedStudent(student);
    setOpenModal(true);
    setStudentHistory(null);
    setForm({
      group_id: "",
      month: new Date().toISOString().slice(0, 7),
      amount: "",
      description: "",
    });
    try {
      const res = await api.get(`/payments/student/${student.id}`);
      setStudentHistory(res.data);

      // studentning guruhlari
      const relatedGroups = groups.filter((g) =>
        g.students?.some((st) => st.id === student.id)
      );
      setAvailableGroups(relatedGroups);

      if (relatedGroups.length === 1) {
        const g = relatedGroups[0];
        setForm((f) => ({
          ...f,
          group_id: g.id,
          amount: g.course?.price || "",
          description: g.course?.title || "",
        }));
      }
    } catch {
      toast.error("Tarixni olishda xato!");
    }
  };

  // group tanlanganda kurs narxi chiqsin
  useEffect(() => {
    if (!form.group_id) return;
    const g = groups.find((gr) => gr.id === Number(form.group_id));
    if (g && g.course) {
      setForm((f) => ({
        ...f,
        amount: g.course.price || "",
        description: g.course.title,
      }));
    }
  }, [form.group_id]);

  // ==================== To‘lov qo‘shish ====================
  const handleAddPayment = async () => {
    if (!selectedStudent?.id || !form.group_id || !form.amount) {
      toast.error("Barcha maydonlarni to‘ldiring!");
      return;
    }
    try {
      await api.post("/payments", {
        student_id: selectedStudent.id,
        group_id: Number(form.group_id),
        amount: Number(form.amount),
        description: form.description,
        month: form.month,
      });
      toast.success("To‘lov qo‘shildi ✅");
      openHistory(selectedStudent);
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xatolik!");
    }
  };

  // ==================== Hisoblash (jadval uchun) ====================
  const grouped = students.map((s) => {
    const pays = payments.filter((p) => p.student_id === s.id);
    const totalPaid = pays.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalDebt = pays.reduce((sum, p) => sum + (p.debt_amount || 0), 0);
    const balance = totalPaid - totalDebt;
    const latestMonth = pays[0]?.month;
    return { ...s, totalPaid, totalDebt, balance, latestMonth };
  });

  // === Filtrlash ===
  const filtered = grouped.filter((s) => {
    if (filterType === "debt") return s.totalDebt > 0;
    if (filterType === "balance") return s.balance > 0;
    if (filterType === "none") return s.totalPaid === 0;
    return true;
  });

  // === Saralash ===
  const sorted = [...filtered].sort((a, b) => {
    if (!sortBy) return 0;
    const dir = sortOrder === "asc" ? 1 : -1;
    return (a[sortBy] - b[sortBy]) * dir;
  });

  // === Jami hisoblash ===
  const totalSummary = sorted.reduce(
    (acc, s) => {
      acc.paid += s.totalPaid;
      acc.debt += s.totalDebt;
      acc.balance += s.balance;
      return acc;
    },
    { paid: 0, debt: 0, balance: 0 }
  );

  return (
    <Box sx={{ p: 3 }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={600} mb={3}>
        💳 To‘lovlar boshqaruvi
      </Typography>

      {/* === Filtr va saralash === */}
      <Stack direction="row" spacing={2} mb={2} justifyContent="space-between">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Filtrlash</InputLabel>
          <Select
            label="Filtrlash"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            startAdornment={<FilterAlt fontSize="small" />}
          >
            <MenuItem value="all">Barchasi</MenuItem>
            <MenuItem value="debt">Qarzdorlar</MenuItem>
            <MenuItem value="balance">Balansda</MenuItem>
            <MenuItem value="none">To‘lov yo‘q</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Saralash</InputLabel>
          <Select
            label="Saralash"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            startAdornment={<Sort fontSize="small" />}
          >
            <MenuItem value="">Standart</MenuItem>
            <MenuItem value="totalPaid">Jami to‘lov</MenuItem>
            <MenuItem value="totalDebt">Qarzdorlik</MenuItem>
            <MenuItem value="balance">Balans</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchPayments}
        >
          Yangilash
        </Button>
      </Stack>

      {/* === Jadval === */}
      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "#f9fafb" }}>
              <TableRow>
                <TableCell>
                  <b>O‘quvchi</b>
                </TableCell>
                <TableCell>
                  <b>So‘nggi oy</b>
                </TableCell>
                <TableCell align="right">
                  <b>To‘lov</b>
                </TableCell>
                <TableCell align="right">
                  <b>Qarzdorlik</b>
                </TableCell>
                <TableCell align="right">
                  <b>Balans</b>
                </TableCell>
                <TableCell>
                  <b>Holat</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((s) => (
                <TableRow
                  key={s.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => openHistory(s)}
                >
                  <TableCell>{s.full_name}</TableCell>
                  <TableCell>{formatMonth(s.latestMonth)}</TableCell>
                  <TableCell align="right">
                    {s.totalPaid.toLocaleString()} so‘m
                  </TableCell>
                  <TableCell align="right" color="error">
                    {s.totalDebt.toLocaleString()} so‘m
                  </TableCell>
                  <TableCell align="right">
                    {s.balance > 0 ? (
                      <Typography color="success.main">
                        +{s.balance.toLocaleString()} so‘m
                      </Typography>
                    ) : s.balance < 0 ? (
                      <Typography color="error">
                        {s.balance.toLocaleString()} so‘m
                      </Typography>
                    ) : (
                      "0"
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        s.balance > 0
                          ? "Balansda"
                          : s.totalDebt > 0
                          ? "Qarzdor"
                          : "To‘langan"
                      }
                      color={
                        s.balance > 0
                          ? "success"
                          : s.totalDebt > 0
                          ? "error"
                          : "primary"
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            {/* Jami natijalar */}
            <TableBody sx={{ bgcolor: "#f3f4f6" }}>
              <TableRow>
                <TableCell colSpan={2}>
                  <b>JAMI:</b>
                </TableCell>
                <TableCell align="right">
                  <b>{totalSummary.paid.toLocaleString()} so‘m</b>
                </TableCell>
                <TableCell align="right" color="error">
                  <b>{totalSummary.debt.toLocaleString()} so‘m</b>
                </TableCell>
                <TableCell align="right">
                  <b>{totalSummary.balance.toLocaleString()} so‘m</b>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* === Modal: Student to‘lov tarixi va yangi to‘lov === */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          sx={{
            bgcolor: "white",
            p: 3,
            borderRadius: 2,
            width: 550,
            mx: "auto",
            mt: 8,
            maxHeight: "85vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" mb={1}>
            {selectedStudent?.full_name} — To‘lov tarixi
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {!studentHistory ? (
            <Box textAlign="center" mt={3}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              <Typography>
                Jami to‘langan:{" "}
                <b>{studentHistory.total_paid.toLocaleString()} so‘m</b>
              </Typography>
              <Typography color="error">
                Qarzdorlik:{" "}
                <b>{studentHistory.total_debt.toLocaleString()} so‘m</b>
              </Typography>
              <Typography color="success.main" mb={2}>
                Balans: <b>{studentHistory.balance.toLocaleString()} so‘m</b>
              </Typography>

              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Oy</TableCell>
                      <TableCell align="right">Summa</TableCell>
                      <TableCell align="right">Qarzdorlik</TableCell>
                      <TableCell>Holat</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentHistory.history.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>{formatMonth(h.month)}</TableCell>
                        <TableCell align="right">
                          {h.amount.toLocaleString()} so‘m
                        </TableCell>
                        <TableCell align="right">
                          {h.debt_amount.toLocaleString()} so‘m
                        </TableCell>
                        <TableCell>{h.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* === Yangi to‘lov form === */}
              <Typography variant="subtitle2" mb={1}>
                ➕ Yangi to‘lov qo‘shish
              </Typography>

              {availableGroups.length > 0 && (
                <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                  <InputLabel>Guruh</InputLabel>
                  <Select
                    value={form.group_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, group_id: e.target.value }))
                    }
                  >
                    <MenuItem value="">Tanlang</MenuItem>
                    {availableGroups.map((g) => (
                      <MenuItem key={g.id} value={g.id}>
                        {g.course?.title} / {g.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <TextField
                fullWidth
                size="small"
                type="month"
                label="Oy"
                sx={{ mb: 1 }}
                value={form.month}
                onChange={(e) =>
                  setForm((f) => ({ ...f, month: e.target.value }))
                }
              />

              <TextField
                fullWidth
                size="small"
                type="number"
                label="Summa (so‘m)"
                sx={{ mb: 1 }}
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />

              <Button
                fullWidth
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddPayment}
              >
                Saqlash
              </Button>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
}
