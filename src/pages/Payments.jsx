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
import { api } from "../services/api"; // <-- sizning axios instance

// ===================== Helper functions =====================
const formatMonthName = (yyyyMm) => {
  if (!yyyyMm) return "-";
  const [y, m] = yyyyMm.split("-");
  if (!y || !m) return yyyyMm;
  try {
    const d = new Date(`${y}-${m.padStart(2, "0")}-01T00:00:00`);
    return new Intl.DateTimeFormat("uz-UZ", {
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return yyyyMm;
  }
};

const formatDateTime = (iso) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("uz-UZ", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
};

// ===================== Component =====================
const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");

  // Modals and form state
  const [openAdd, setOpenAdd] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [openPayModal, setOpenPayModal] = useState(false);

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

  // ===================== Fetchers =====================
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/payments");
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("To‘lovlarni olishda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get("/users");
      setStudents(
        Array.isArray(res.data)
          ? res.data.filter((u) => u.role === "student")
          : []
      );
    } catch (err) {
      console.error(err);
      toast.error("O‘quvchilarni olishda xatolik!");
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Guruhlar olinmadi!");
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStudents();
    fetchGroups();
  }, []);

  // ===================== Filters / derived =====================
  const filteredPayments = selectedMonth
    ? payments.filter((p) => p.month === selectedMonth)
    : payments;

  const summary = filteredPayments.reduce(
    (acc, p) => {
      acc.total += Number(p.amount || 0);
      acc.count += 1;
      return acc;
    },
    { total: 0, count: 0 }
  );

  // ===================== Add payment helpers =====================
  // When a student is chosen, find groups containing that student
  useEffect(() => {
    if (!form.student_id) {
      setAvailableGroups([]);
      setForm((s) => ({ ...s, group_id: "" }));
      return;
    }
    const sid = Number(form.student_id);
    const groupsForStudent = groups.filter((g) =>
      Array.isArray(g.students) ? g.students.some((st) => st.id === sid) : false
    );
    setAvailableGroups(groupsForStudent);

    // If only one group -> preselect + autofill amount and description from course
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

  // ===================== Actions =====================
  const handleAddPayment = async () => {
    // default month to current if not provided
    const monthToSend = form.month || new Date().toISOString().slice(0, 7);
    if (!form.student_id || !form.group_id || !form.amount) {
      toast.error("O'quvchi, guruh va summa majburiy!");
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
      toast.success("To'lov qo'shildi");
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
      console.error(err);
      toast.error(err?.response?.data?.detail || "To'lov qo'shishda xatolik");
    }
  };

  const handleGenerateDebts = async () => {
    try {
      const res = await api.post("/payments/generate-debts");
      toast.success(res.data?.message || "Qarz yozildi");
      fetchPayments();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Qarz yozishda xatolik");
    }
  };

  const openHistoryForStudent = async (studentId) => {
    try {
      const res = await api.get(`/payments/student/${studentId}/history`);
      setHistoryData(res.data);
      setOpenHistory(true);
    } catch (err) {
      console.error(err);
      toast.error("Tarixni olishda xatolik");
    }
  };

  const handleOpenPayModal = (payment) => {
    setSelectedPayment(payment);
    setPayAmount("");
    setOpenPayModal(true);
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
      toast.success("To'lov yangilandi");
      setOpenPayModal(false);
      setSelectedPayment(null);
      setPayAmount("");
      fetchPayments();
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.detail || "To'lovni yangilashda xatolik"
      );
    }
  };

  const handleExportExcel = () => {
    if (!filteredPayments.length) {
      toast.error("Ma'lumot yo'q");
      return;
    }
    const data = filteredPayments.map((p) => ({
      ID: p.id,
      Oquvchi: p.student?.full_name || p.student?.username || "-",
      Kurs: p.group?.course?.title || "-",
      Guruh: p.group?.name || "-",
      Oy: formatMonthName(p.month),
      "To'langan summa": `${Number(p.amount || 0).toLocaleString()} so'm`,
      Izoh: p.description || "-",
      "Yaratilgan sana": formatDateTime(p.created_at),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "To'lovlar");
    XLSX.writeFile(
      wb,
      `Tolovlar_${selectedMonth || "barcha"}_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  };

  // ===================== Render =====================
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f7f8fb", minHeight: "100vh" }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={600} mb={3}>
        💸 To‘lovlar boshqaruvi
      </Typography>

      {/* Summary */}
      <Box
        sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 3 }}
      >
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle2">Jami yozuvlar</Typography>
          <Typography variant="h6">{summary.count}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 2 }}>
          <Typography variant="subtitle2">Umumiy to‘langan summa</Typography>
          <Typography variant="h6">
            {summary.total.toLocaleString()} so‘m
          </Typography>
        </Paper>
      </Box>

      {/* Filters + actions */}
      <Grid container spacing={2} alignItems="center" mb={2}>
        <Grid item xs={12} md={4}>
          <TextField
            select
            label="Oy bo‘yicha filter"
            fullWidth
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

        <Grid item xs={12} md={8} textAlign="right">
          <Button
            variant="outlined"
            color="secondary"
            sx={{ mr: 2 }}
            onClick={handleExportExcel}
          >
            📊 Excel’ga eksport
          </Button>
          <Button
            variant="contained"
            color="success"
            sx={{ mr: 2 }}
            onClick={handleGenerateDebts}
          >
            ⚙️ Qarz yozish
          </Button>
          <Button variant="contained" onClick={() => setOpenAdd(true)}>
            ➕ To‘lov qo‘shish
          </Button>
        </Grid>
      </Grid>

      {/* Table */}
      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : filteredPayments.length ? (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#fafafa" }}>
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
                  <b>To‘langan summa</b>
                </TableCell>
                <TableCell>
                  <b>Izoh</b>
                </TableCell>
                <TableCell>
                  <b>Yaratilgan sana</b>
                </TableCell>
                <TableCell>
                  <b>Holat</b>
                </TableCell>
                <TableCell>
                  <b>Amallar</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>
                    {p.student?.full_name || p.student?.username || "-"}
                  </TableCell>
                  <TableCell>{p.group?.course?.title || "-"}</TableCell>
                  <TableCell>{p.group?.name || "-"}</TableCell>
                  <TableCell>{formatMonthName(p.month)}</TableCell>
                  <TableCell align="right">
                    <b>{Number(p.amount || 0).toLocaleString()}</b> so‘m
                  </TableCell>
                  <TableCell>{p.description || "-"}</TableCell>
                  <TableCell>{formatDateTime(p.created_at)}</TableCell>
                  <TableCell>
                    {p.status === "paid"
                      ? "To'langan"
                      : p.status === "partial"
                      ? "Qisman"
                      : "To'lanmagan"}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {p.student_id && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openHistoryForStudent(p.student_id)}
                        >
                          Tarix
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleOpenPayModal(p)}
                      >
                        To'landi
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography textAlign="center" mt={4} color="gray">
          Ma’lumot topilmadi ☹️
        </Typography>
      )}

      {/* ===================== ADD PAYMENT MODAL ===================== */}
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
            ➕ To'lov qo'shish
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>O'quvchi</InputLabel>
            <Select
              value={form.student_id}
              label="O'quvchi"
              onChange={(e) =>
                setForm((prev) => ({ ...prev, student_id: e.target.value }))
              }
            >
              <MenuItem value="">— Tanlang —</MenuItem>
              {students.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.full_name || s.username} {s.phone ? `(${s.phone})` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Guruh (kurs)</InputLabel>
            <Select
              value={form.group_id}
              label="Guruh"
              onChange={(e) => {
                const g = availableGroups.find(
                  (gr) => gr.id === e.target.value
                );
                setForm((prev) => ({
                  ...prev,
                  group_id: e.target.value,
                  amount: g?.course?.price ?? prev.amount,
                  description: g?.course?.title ?? prev.description,
                }));
              }}
            >
              <MenuItem value="">— Tanlang —</MenuItem>
              {availableGroups.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.course?.title || "-"} — {g.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Oy (YYYY-MM)"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            placeholder={new Date().toISOString().slice(0, 7)}
            value={form.month}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, month: e.target.value }))
            }
          />

          <TextField
            label="Summa"
            fullWidth
            size="small"
            type="number"
            sx={{ mb: 2 }}
            value={form.amount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, amount: e.target.value }))
            }
          />

          <TextField
            label="Izoh"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
          />

          <Button fullWidth variant="contained" onClick={handleAddPayment}>
            Saqlash
          </Button>
        </Box>
      </Modal>

      {/* ===================== MARK AS PAID MODAL ===================== */}
      <Modal open={openPayModal} onClose={() => setOpenPayModal(false)}>
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
            💰 To'lovni belgilash
          </Typography>
          <Typography mb={1}>
            O'quvchi:{" "}
            <strong>
              {selectedPayment?.student?.full_name ||
                selectedPayment?.student?.username ||
                "-"}
            </strong>
          </Typography>
          <Typography mb={2}>
            Kurs:{" "}
            <strong>{selectedPayment?.group?.course?.title || "-"}</strong>
          </Typography>

          <TextField
            label="To'lov summasi (so'm)"
            type="number"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
          <Button fullWidth variant="contained" onClick={handleMarkPaid}>
            Tasdiqlash
          </Button>
        </Box>
      </Modal>

      {/* ===================== HISTORY MODAL ===================== */}
      <Modal open={openHistory} onClose={() => setOpenHistory(false)}>
        <Box
          sx={{
            bgcolor: "white",
            p: 3,
            borderRadius: 2,
            width: { xs: "90%", md: 640 },
            mx: "auto",
            mt: 8,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" mb={2}>
            📜 {historyData?.student_name || ""} to'lov tarixi
          </Typography>
          {historyData ? (
            <>
              <Typography>
                Jami to'langan:{" "}
                <strong>
                  {Number(historyData.total_paid || 0).toLocaleString()} so'm
                </strong>
              </Typography>
              <Typography mb={2}>
                Qarzdorlik:{" "}
                <strong>
                  {Number(historyData.total_debt || 0).toLocaleString()} so'm
                </strong>
              </Typography>

              {historyData.history.map((h, i) => (
                <Box
                  key={i}
                  sx={{ borderBottom: "1px solid #eee", py: 1, mb: 1 }}
                >
                  <Typography variant="body2">
                    <b>{formatMonthName(h.month)}</b> — {h.course_name || "-"} /{" "}
                    {h.group_name || "-"}
                  </Typography>
                  <Typography variant="body2">
                    To'langan: {Number(h.amount || 0).toLocaleString()} so'm
                  </Typography>
                  <Typography variant="body2">
                    Qarzdorlik: {Number(h.debt_amount || 0).toLocaleString()}{" "}
                    so'm
                  </Typography>
                  <Typography
                    variant="body2"
                    color={
                      h.status === "paid"
                        ? "green"
                        : h.status === "partial"
                        ? "orange"
                        : "red"
                    }
                  >
                    Holat: {h.status}
                  </Typography>
                </Box>
              ))}
            </>
          ) : (
            <Typography>Ma'lumot yo'q</Typography>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default Payments;
