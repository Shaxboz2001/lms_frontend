import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  MenuItem,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Modal,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Stack,
} from "@mui/material";
import {
  DateRange,
  Calculate,
  Refresh,
  FileDownload,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../services/api";

// === Helperlar ===
const formatMonthName = (yyyyMm) => {
  if (!yyyyMm) return "-";
  try {
    const [y, m] = yyyyMm.split("-");
    const date = new Date(`${y}-${m}-01`);
    return date.toLocaleDateString("uz-UZ", { year: "numeric", month: "long" });
  } catch {
    return yyyyMm;
  }
};
const formatDateTime = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusColor = {
  paid: "success",
  partial: "warning",
  unpaid: "error",
};

// =============================================================
export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [showOnlyDebtors, setShowOnlyDebtors] = useState(false);

  const [openAdd, setOpenAdd] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [form, setForm] = useState({
    student_id: "",
    group_id: "",
    amount: "",
    description: "",
    month: "",
  });
  const [availableGroups, setAvailableGroups] = useState([]);

  // ================== Fetching =====================
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/payments");
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("To‘lovlarni olishda xatolik!");
    } finally {
      setLoading(false);
    }
  };
  const fetchStudents = async () => {
    try {
      const res = await api.get("/users");
      setStudents(res.data.filter((u) => u.role === "student"));
    } catch {
      toast.error("O‘quvchilar olinmadi");
    }
  };
  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(res.data);
    } catch {
      toast.error("Guruhlar olinmadi");
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStudents();
    fetchGroups();
  }, []);

  // ================== Filtrlash =====================
  const filtered = payments.filter((p) => {
    if (selectedMonth && p.month !== selectedMonth) return false;
    if (showOnlyDebtors && p.status === "paid") return false;
    return true;
  });

  const summary = filtered.reduce(
    (acc, p) => {
      acc.total += p.amount || 0;
      acc.count += 1;
      return acc;
    },
    { total: 0, count: 0 }
  );

  // ================== Form helpers =====================
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
    if (related.length === 1) {
      const g = related[0];
      setForm((f) => ({
        ...f,
        group_id: g.id,
        amount: g.course?.price || "",
        description: g.course?.title || "",
      }));
    }
  }, [form.student_id, groups]);

  // ================== Actions =====================
  const handleAdd = async () => {
    if (!form.student_id || !form.group_id || !form.amount) {
      toast.error("O‘quvchi, guruh va summa majburiy!");
      return;
    }
    try {
      await api.post("/payments", {
        student_id: Number(form.student_id),
        group_id: Number(form.group_id),
        amount: Number(form.amount),
        description: form.description,
        month: form.month || new Date().toISOString().slice(0, 7),
      });
      toast.success("To‘lov qo‘shildi ✅");
      setOpenAdd(false);
      fetchPayments();
      setForm({
        student_id: "",
        group_id: "",
        amount: "",
        description: "",
        month: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xatolik!");
    }
  };

  const handleCalculateMonthly = async () => {
    try {
      const res = await api.post("/payments/calculate-monthly", {
        month: selectedMonth || new Date().toISOString().slice(0, 7),
      });
      toast.success(res.data.message);
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Hisoblashda xatolik!");
    }
  };

  const handleCalculateCurrentMonth = async () => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    try {
      const res = await api.post("/payments/calculate-monthly", {
        month: thisMonth,
      });
      toast.success(`📅 ${formatMonthName(thisMonth)} uchun hisob yangilandi`);
      fetchPayments();
    } catch (err) {
      toast.error("Joriy oy uchun hisoblashda xatolik!");
    }
  };

  const handleExportExcel = () => {
    if (!filtered.length) {
      toast.error("Ma’lumot yo‘q!");
      return;
    }
    const data = filtered.map((p) => ({
      ID: p.id,
      "O‘quvchi": p.student?.full_name || "-",
      Kurs: p.group?.course?.title || "-",
      Guruh: p.group?.name || "-",
      Oy: formatMonthName(p.month),
      Summa: (p.amount || 0).toLocaleString() + " so‘m",
      Qarzdorlik: (p.debt_amount || 0).toLocaleString() + " so‘m",
      Holat: p.status,
      Sana: formatDateTime(p.created_at),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "To‘lovlar");
    XLSX.writeFile(wb, `Tolovlar_${selectedMonth || "barcha"}.xlsx`);
  };

  // ================== Render =====================
  return (
    <Box sx={{ p: 3, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={600} mb={3}>
        💳 To‘lovlar boshqaruvi
      </Typography>

      {/* Summary */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="subtitle2">Jami yozuvlar</Typography>
            <Typography variant="h6">{summary.count}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="subtitle2">Jami summa</Typography>
            <Typography variant="h6">
              {summary.total.toLocaleString()} so‘m
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="subtitle2">Filter</Typography>
            <TextField
              select
              fullWidth
              size="small"
              label="Oy tanlang"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <MenuItem value="">Barcha</MenuItem>
              {[...new Set(payments.map((p) => p.month))].map((m) => (
                <MenuItem key={m} value={m}>
                  {formatMonthName(m)}
                </MenuItem>
              ))}
            </TextField>
          </Paper>
        </Grid>
      </Grid>

      {/* Action buttons */}
      <Stack direction="row" spacing={2} justifyContent="flex-end" mb={3}>
        <Button
          variant="outlined"
          startIcon={<FileDownload />}
          onClick={handleExportExcel}
        >
          Excel eksport
        </Button>
        <Button
          variant={showOnlyDebtors ? "contained" : "outlined"}
          color="error"
          onClick={() => setShowOnlyDebtors(!showOnlyDebtors)}
        >
          Qarzdorlar
        </Button>
        <Button
          variant="contained"
          color="info"
          startIcon={<Calculate />}
          onClick={handleCalculateMonthly}
        >
          ⚙️ Barcha oyni hisoblash
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<DateRange />}
          onClick={handleCalculateCurrentMonth}
        >
          📅 Shu oy uchun hisoblash
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => setOpenAdd(true)}
        >
          ➕ To‘lov qo‘shish
        </Button>
      </Stack>

      {/* Jadval */}
      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : filtered.length ? (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: "#f3f4f6" }}>
              <TableRow>
                <TableCell>
                  <b>ID</b>
                </TableCell>
                <TableCell>
                  <b>O‘quvchi</b>
                </TableCell>
                <TableCell>
                  <b>Kurs</b>
                </TableCell>
                <TableCell>
                  <b>Guruh</b>
                </TableCell>
                <TableCell>
                  <b>Oy</b>
                </TableCell>
                <TableCell align="right">
                  <b>Summa</b>
                </TableCell>
                <TableCell align="right">
                  <b>Qarzdorlik</b>
                </TableCell>
                <TableCell>
                  <b>Holat</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.student?.full_name || "-"}</TableCell>
                  <TableCell>{p.group?.course?.title || "-"}</TableCell>
                  <TableCell>{p.group?.name || "-"}</TableCell>
                  <TableCell>{formatMonthName(p.month)}</TableCell>
                  <TableCell align="right">
                    {(p.amount || 0).toLocaleString()} so‘m
                  </TableCell>
                  <TableCell align="right">
                    {(p.debt_amount || 0).toLocaleString()} so‘m
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        p.status === "paid"
                          ? "To‘langan"
                          : p.status === "partial"
                          ? "Qisman"
                          : "Qarzdor"
                      }
                      color={statusColor[p.status]}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography align="center" mt={4} color="gray">
          Ma’lumot topilmadi ☹️
        </Typography>
      )}

      {/* Modal: To‘lov qo‘shish */}
      <Modal open={openAdd} onClose={() => setOpenAdd(false)}>
        <Box
          sx={{
            bgcolor: "white",
            p: 3,
            borderRadius: 2,
            width: 420,
            mx: "auto",
            mt: 10,
          }}
        >
          <Typography variant="h6" mb={2}>
            ➕ To‘lov qo‘shish
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>O‘quvchi</InputLabel>
            <Select
              value={form.student_id}
              label="O‘quvchi"
              onChange={(e) =>
                setForm((f) => ({ ...f, student_id: e.target.value }))
              }
            >
              <MenuItem value="">Tanlang</MenuItem>
              {students.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.full_name || s.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Guruh</InputLabel>
            <Select
              value={form.group_id}
              label="Guruh"
              onChange={(e) => {
                const g = availableGroups.find(
                  (gr) => gr.id === e.target.value
                );
                setForm((f) => ({
                  ...f,
                  group_id: e.target.value,
                  amount: g?.course?.price || "",
                  description: g?.course?.title || "",
                }));
              }}
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
            label="Summa"
            type="number"
            sx={{ mb: 2 }}
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <TextField
            fullWidth
            size="small"
            label="Izoh"
            sx={{ mb: 2 }}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
          <Button fullWidth variant="contained" onClick={handleAdd}>
            Saqlash
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
