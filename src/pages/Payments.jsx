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
import { Add, Refresh, Calculate, History } from "@mui/icons-material";
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
  const [calcLoading, setCalcLoading] = useState(false);

  const [filters, setFilters] = useState({
    student: "",
    group: "",
    course: "",
  });

  const [openModal, setOpenModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState(null);
  const [form, setForm] = useState({
    student_id: "",
    group_id: "",
    amount: "",
    description: "",
    month: new Date().toISOString().slice(0, 7),
  });

  const [availableGroups, setAvailableGroups] = useState([]);

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

  // ==================== Talaba tarixi ====================
  const openHistory = async (student) => {
    setSelectedStudent(student);
    setOpenModal(true);
    try {
      const res = await api.get(`/payments/student/${student.id}`);
      setStudentHistory(res.data);
    } catch {
      toast.error("Tarixni olishda xato!");
    }
  };

  // ==================== Filtrlash ====================
  const filteredStudents = students.filter((s) => {
    const group = groups.find((g) => g.students?.some((st) => st.id === s.id));
    if (filters.group && group?.id !== parseInt(filters.group)) return false;
    if (filters.course && group?.course?.id !== parseInt(filters.course))
      return false;
    if (
      filters.student &&
      !s.full_name?.toLowerCase().includes(filters.student.toLowerCase())
    )
      return false;
    return true;
  });

  // ==================== Hisoblash jadvali ====================
  const grouped = filteredStudents.map((s) => {
    const pays = payments.filter((p) => p.student_id === s.id);
    const totalPaid = pays.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalDebt = pays.reduce((sum, p) => sum + (p.debt_amount || 0), 0);
    const balance = totalPaid - totalDebt;
    const latestMonth = pays.length ? pays[0].month : "-";
    return {
      id: s.id,
      name: s.full_name,
      totalPaid,
      totalDebt,
      balance,
      latestMonth,
    };
  });

  // ==================== To‘lov qo‘shish ====================
  useEffect(() => {
    if (!form.student_id) {
      setAvailableGroups([]);
      return;
    }
    const sid = Number(form.student_id);
    const related = groups.filter((g) =>
      g.students?.some((st) => st.id === sid)
    );
    setAvailableGroups(related);
  }, [form.student_id, groups]);

  const handleAddPayment = async () => {
    if (!form.student_id || !form.group_id || !form.amount) {
      toast.error("Barcha maydonlar to‘ldirilishi kerak!");
      return;
    }
    try {
      await api.post("/payments", {
        student_id: Number(form.student_id),
        group_id: Number(form.group_id),
        amount: Number(form.amount),
        description: form.description,
        month: form.month,
      });
      toast.success("To‘lov qo‘shildi ✅");
      setForm({
        student_id: "",
        group_id: "",
        amount: "",
        description: "",
        month: new Date().toISOString().slice(0, 7),
      });
      fetchPayments();
      if (selectedStudent) openHistory(selectedStudent);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xatolik!");
    }
  };

  // ==================== Oylik qarzlarni hisoblash ====================
  const handleCalculateMonthly = async () => {
    setCalcLoading(true);
    try {
      const month = new Date().toISOString().slice(0, 7);
      const res = await api.post("/payments/calculate-monthly", { month });
      toast.success(res.data.message || "Hisoblash yakunlandi ✅");
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Hisoblashda xato!");
    } finally {
      setCalcLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={600} mb={3}>
        💰 To‘lovlar boshqaruvi
      </Typography>

      {/* Filtrlar */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            size="small"
            label="O‘quvchi ismi"
            value={filters.student}
            onChange={(e) =>
              setFilters((f) => ({ ...f, student: e.target.value }))
            }
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Guruh</InputLabel>
            <Select
              value={filters.group}
              onChange={(e) =>
                setFilters((f) => ({ ...f, group: e.target.value }))
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
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Kurs</InputLabel>
            <Select
              value={filters.course}
              onChange={(e) =>
                setFilters((f) => ({ ...f, course: e.target.value }))
              }
            >
              <MenuItem value="">Barchasi</MenuItem>
              {groups
                .map((g) => g.course)
                .filter(Boolean)
                .map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.title}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Tugmalar */}
      <Stack direction="row" spacing={2} mb={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchPayments}
        >
          Yangilash
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Calculate />}
          onClick={handleCalculateMonthly}
          disabled={calcLoading}
        >
          {calcLoading ? "Hisoblanmoqda..." : "Oylik qarzlarni hisobla"}
        </Button>
      </Stack>

      {/* Jadval */}
      {loading ? (
        <Box textAlign="center" mt={5}>
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
              {grouped.map((s) => (
                <TableRow
                  key={s.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() =>
                    openHistory(students.find((st) => st.id === s.id))
                  }
                >
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{formatMonth(s.latestMonth)}</TableCell>
                  <TableCell align="right">
                    {s.totalPaid.toLocaleString()} so‘m
                  </TableCell>
                  <TableCell align="right">
                    {s.totalDebt > 0 ? (
                      <Typography color="error">
                        -{s.totalDebt.toLocaleString()} so‘m
                      </Typography>
                    ) : (
                      "0"
                    )}
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
                          : s.totalPaid > 0
                          ? "To‘langan"
                          : "To‘lov yo‘q"
                      }
                      color={
                        s.balance > 0
                          ? "success"
                          : s.totalDebt > 0
                          ? "error"
                          : s.totalPaid > 0
                          ? "primary"
                          : "default"
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal: Tarix + to‘lov qo‘shish */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          sx={{
            bgcolor: "white",
            p: 3,
            borderRadius: 2,
            width: 520,
            mx: "auto",
            mt: 8,
            maxHeight: "85vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" mb={2}>
            {selectedStudent?.full_name} — To‘lov tarixi
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {studentHistory ? (
            <>
              <Typography fontWeight={500}>
                Jami to‘langan:{" "}
                <b>{studentHistory.total_paid.toLocaleString()} so‘m</b>
              </Typography>
              <Typography fontWeight={500}>
                Jami qarz:{" "}
                <b style={{ color: "red" }}>
                  {studentHistory.total_debt.toLocaleString()} so‘m
                </b>
              </Typography>
              <Typography mb={2}>
                Balans:{" "}
                <b
                  style={{
                    color:
                      studentHistory.balance > 0
                        ? "green"
                        : studentHistory.balance < 0
                        ? "red"
                        : "inherit",
                  }}
                >
                  {studentHistory.balance.toLocaleString()} so‘m
                </b>
              </Typography>

              <TableContainer component={Paper}>
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
            </>
          ) : (
            <Box textAlign="center" my={3}>
              <CircularProgress size={24} />
            </Box>
          )}

          <Typography variant="subtitle2" mt={3} mb={1}>
            ➕ Yangi to‘lov
          </Typography>
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
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Summa (so‘m)"
            sx={{ mb: 1 }}
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <Button
            variant="contained"
            fullWidth
            startIcon={<Add />}
            onClick={handleAddPayment}
          >
            Saqlash
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
