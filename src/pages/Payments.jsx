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
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import * as XLSX from "xlsx";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../services/api";

// === Helperlar ===
const formatMonthName = (yyyyMm) => {
  if (!yyyyMm) return "-";
  const [y, m] = yyyyMm.split("-");
  const d = new Date(`${y}-${m}-01`);
  return d.toLocaleDateString("uz-UZ", { month: "long", year: "numeric" });
};
const formatDateTime = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [openAdd, setOpenAdd] = useState(false);
  const [openPayModal, setOpenPayModal] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);

  const [form, setForm] = useState({
    student_id: "",
    group_id: "",
    amount: "",
    description: "",
    month: "",
  });
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [historyData, setHistoryData] = useState(null);

  // === Fetchers ===
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/payments");
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("To‘lovlar yuklanmadi");
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

  // === Filterlar ===
  let filteredPayments = payments;
  if (selectedMonth)
    filteredPayments = filteredPayments.filter(
      (p) => p.month === selectedMonth
    );
  if (selectedStatus)
    filteredPayments = filteredPayments.filter(
      (p) => p.status === selectedStatus
    );

  const summary = filteredPayments.reduce(
    (acc, p) => {
      acc.total += Number(p.amount || 0);
      acc.count += 1;
      return acc;
    },
    { total: 0, count: 0 }
  );

  // === O‘quvchi tanlansa, guruhlarni chiqarish ===
  useEffect(() => {
    if (!form.student_id) {
      setAvailableGroups([]);
      setForm((s) => ({ ...s, group_id: "" }));
      return;
    }
    const sid = Number(form.student_id);
    const groupsForStudent = groups.filter((g) =>
      g.students?.some((st) => st.id === sid)
    );
    setAvailableGroups(groupsForStudent);

    if (groupsForStudent.length === 1) {
      const g = groupsForStudent[0];
      setForm((prev) => ({
        ...prev,
        group_id: g.id,
        amount: g.course?.price ?? prev.amount,
        description: g.course?.title ?? prev.description,
      }));
    }
  }, [form.student_id, groups]);

  // === Actions ===
  const handleAddPayment = async () => {
    const monthToSend = form.month || new Date().toISOString().slice(0, 7);
    if (!form.student_id || !form.group_id || !form.amount) {
      toast.error("Majburiy maydonlar to‘ldirilsin!");
      return;
    }
    try {
      await api.post("/payments", {
        student_id: Number(form.student_id),
        group_id: Number(form.group_id),
        amount: Number(form.amount),
        description: form.description,
        month: monthToSend,
      });
      toast.success("To‘lov qo‘shildi");
      setOpenAdd(false);
      setForm({
        student_id: "",
        group_id: "",
        amount: "",
        description: "",
        month: "",
      });
      fetchPayments();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Xatolik");
    }
  };

  const handleCalculateMonthly = async () => {
    try {
      const res = await api.post("/payments/calculate-monthly");
      toast.success(res.data?.message || "Hisoblash yakunlandi");
      fetchPayments();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Hisoblashda xatolik");
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedPayment?.id || !payAmount) {
      toast.error("Summani kiriting!");
      return;
    }
    try {
      await api.put(`/payments/mark-paid/${selectedPayment.id}`, {
        amount: Number(payAmount),
      });
      toast.success("To‘lov yangilandi");
      setOpenPayModal(false);
      fetchPayments();
    } catch {
      toast.error("Yangilashda xatolik");
    }
  };

  const openHistoryForStudent = async (studentId) => {
    try {
      const res = await api.get(`/payments/student/${studentId}/history`);
      setHistoryData(res.data);
      setOpenHistory(true);
    } catch {
      toast.error("Tarix topilmadi");
    }
  };

  const handleExportExcel = () => {
    if (!filteredPayments.length) return toast.error("Ma‘lumot yo‘q");
    const data = filteredPayments.map((p) => ({
      ID: p.id,
      "O‘quvchi": p.student?.full_name || "-",
      Kurs: p.group?.course?.title || "-",
      Guruh: p.group?.name || "-",
      Oy: formatMonthName(p.month),
      Holat: p.status,
      "To‘langan summa": `${Number(p.amount || 0).toLocaleString()} so‘m`,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "To‘lovlar");
    XLSX.writeFile(wb, "Tolovlar.xlsx");
  };

  // === Render ===
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f7f8fb", minHeight: "100vh" }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={600} mb={3}>
        💸 To‘lovlar boshqaruvi
      </Typography>

      {/* Statistikalar */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography>Jami yozuvlar</Typography>
            <Typography variant="h6">{summary.count}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography>To‘langan summa</Typography>
            <Typography variant="h6">
              {summary.total.toLocaleString()} so‘m
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filterlar */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label="Oy bo‘yicha filter"
            size="small"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <MenuItem value="">Barcha oylar</MenuItem>
            {[...new Set(payments.map((p) => p.month))].map((m) => (
              <MenuItem key={m} value={m}>
                {formatMonthName(m)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label="Holat"
            size="small"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <MenuItem value="">Barchasi</MenuItem>
            <MenuItem value="paid">To‘langan</MenuItem>
            <MenuItem value="partial">Qisman</MenuItem>
            <MenuItem value="unpaid">To‘lanmagan</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4} textAlign="right">
          <Button onClick={handleExportExcel} sx={{ mr: 1 }} variant="outlined">
            📊 Excel
          </Button>
          <Button
            onClick={handleCalculateMonthly}
            sx={{ mr: 1 }}
            variant="contained"
            color="info"
          >
            ⚙️ Hisoblash
          </Button>
          <Button variant="contained" onClick={() => setOpenAdd(true)}>
            ➕ Qo‘shish
          </Button>
        </Grid>
      </Grid>

      {/* Jadval */}
      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : filteredPayments.length ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: "#f0f0f0" }}>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>O‘quvchi</TableCell>
                <TableCell>Kurs</TableCell>
                <TableCell>Guruh</TableCell>
                <TableCell>Oy</TableCell>
                <TableCell>Summa</TableCell>
                <TableCell>Holat</TableCell>
                <TableCell>Amallar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.student?.full_name}</TableCell>
                  <TableCell>{p.group?.course?.title}</TableCell>
                  <TableCell>{p.group?.name}</TableCell>
                  <TableCell>{formatMonthName(p.month)}</TableCell>
                  <TableCell>
                    {Number(p.amount || 0).toLocaleString()} so‘m
                  </TableCell>
                  <TableCell
                    sx={{
                      color:
                        p.amount === p.student.fee
                          ? "green"
                          : p.amount > 0
                          ? "orange"
                          : "red",
                      fontWeight: 600,
                    }}
                  >
                    {p.amount === p.student.fee
                      ? "To‘langan"
                      : p.amount > 0
                      ? "Qisman"
                      : `${p.status}`}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => openHistoryForStudent(p.student_id)}
                    >
                      Tarix
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => {
                        setSelectedPayment(p);
                        setOpenPayModal(true);
                      }}
                    >
                      To‘landi
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography textAlign="center" mt={3}>
          Ma‘lumot yo‘q ☹️
        </Typography>
      )}

      {/* === To‘lov qo‘shish modal === */}
      <Modal open={openAdd} onClose={() => setOpenAdd(false)}>
        <Box
          sx={{
            bgcolor: "white",
            p: 3,
            borderRadius: 2,
            width: 400,
            mx: "auto",
            mt: 10,
          }}
        >
          <Typography variant="h6" mb={2}>
            ➕ Yangi to‘lov
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>O‘quvchi</InputLabel>
            <Select
              value={form.student_id}
              label="O‘quvchi"
              onChange={(e) =>
                setForm((p) => ({ ...p, student_id: e.target.value }))
              }
            >
              <MenuItem value="">— Tanlang —</MenuItem>
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
                setForm((p) => ({
                  ...p,
                  group_id: e.target.value,
                  amount: g?.course?.price || p.amount,
                  description: g?.course?.title || p.description,
                }));
              }}
            >
              <MenuItem value="">— Tanlang —</MenuItem>
              {availableGroups.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.course?.title} — {g.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            select
            fullWidth
            label="Oy"
            size="small"
            sx={{ mb: 2 }}
            value={form.month}
            onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))}
          >
            {[...Array(12)].map((_, i) => {
              const d = new Date();
              d.setMonth(i);
              const val = `${d.getFullYear()}-${String(i + 1).padStart(
                2,
                "0"
              )}`;
              return (
                <MenuItem key={i} value={val}>
                  {formatMonthName(val)}
                </MenuItem>
              );
            })}
          </TextField>

          <TextField
            label="Summa"
            type="number"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
          />

          <Button fullWidth variant="contained" onClick={handleAddPayment}>
            Saqlash
          </Button>
        </Box>
      </Modal>

      {/* === To‘lovni belgilash modal === */}
      <Modal open={openPayModal} onClose={() => setOpenPayModal(false)}>
        <Box
          sx={{
            bgcolor: "white",
            p: 3,
            borderRadius: 2,
            width: 400,
            mx: "auto",
            mt: 10,
          }}
        >
          <Typography variant="h6" mb={2}>
            💰 To‘lovni belgilash
          </Typography>
          <Typography>
            {selectedPayment?.student?.full_name} —{" "}
            {selectedPayment?.group?.course?.title}
          </Typography>
          <TextField
            label="To‘lov summasi"
            fullWidth
            size="small"
            type="number"
            sx={{ mt: 2, mb: 2 }}
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
          <Button fullWidth variant="contained" onClick={handleMarkPaid}>
            Tasdiqlash
          </Button>
        </Box>
      </Modal>

      {/* === Tarix modal === */}
      <Modal open={openHistory} onClose={() => setOpenHistory(false)}>
        <Box
          sx={{
            bgcolor: "white",
            p: 3,
            borderRadius: 2,
            width: 600,
            mx: "auto",
            mt: 8,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" mb={2}>
            📜 To‘lov tarixi
          </Typography>
          {historyData ? (
            <>
              <Typography>
                Jami to‘langan:{" "}
                <b>
                  {Number(historyData.total_paid || 0).toLocaleString()} so‘m
                </b>
              </Typography>
              <Typography mb={2}>
                Qarzdorlik:{" "}
                <b>
                  {Number(historyData.total_debt || 0).toLocaleString()} so‘m
                </b>
              </Typography>
              {historyData.history.map((h, i) => (
                <Box key={i} sx={{ borderBottom: "1px solid #eee", py: 1 }}>
                  <Typography>
                    <b>{formatMonthName(h.month)}</b> — {h.course_name || "-"}
                  </Typography>
                  <Typography>
                    To‘langan: {h.amount.toLocaleString()} so‘m
                  </Typography>
                  <Typography color="gray">
                    Qarzdorlik: {h.debt_amount.toLocaleString()} so‘m
                  </Typography>
                </Box>
              ))}
            </>
          ) : (
            <Typography>Ma‘lumot yo‘q</Typography>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default Payments;
