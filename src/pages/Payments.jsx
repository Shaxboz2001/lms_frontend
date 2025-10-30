import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
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
} from "@mui/material";
import { Add, Refresh, Calculate } from "@mui/icons-material";
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
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [debtors, setDebtors] = useState([]);

  const [openModal, setOpenModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [form, setForm] = useState({
    student_id: "",
    group_id: "",
    month: filterMonth,
    amount: "",
  });
  const [availableGroups, setAvailableGroups] = useState([]);

  // ================= Fetch Data =================
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, gRes] = await Promise.all([
        api.get("/payments"),
        api.get("/users"),
        api.get("/groups"),
      ]);
      setPayments(pRes.data || []);
      setStudents(sRes.data.filter((u) => u.role === "student"));
      setGroups(gRes.data);
    } catch {
      toast.error("Ma'lumotlarni olishda xato!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ================= Calculate Monthly =================
  const handleCalculateMonthly = async () => {
    setLoading(true);
    try {
      const res = await api.post("/payments/calculate-monthly", {
        month: filterMonth,
      });
      toast.success(res.data.message);
      setDebtors(res.data.debtors || []);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Hisoblashda xato!");
    } finally {
      setLoading(false);
    }
  };

  // ================= Student History =================
  const openHistory = async (student) => {
    setSelectedStudent(student);
    setOpenModal(true);
    setStudentHistory([]);
    setForm({
      student_id: student.id,
      group_id: "",
      month: filterMonth,
      amount: "",
    });
    try {
      const res = await api.get(`/payments/student/${student.id}`);
      setStudentHistory(res.data.history || []);
      const related = groups.filter((g) =>
        g.students?.some((st) => st.id === student.id)
      );
      setAvailableGroups(related);
      if (related.length === 1) {
        const g = related[0];
        setForm((f) => ({
          ...f,
          group_id: g.id,
          amount: g.course?.price || "",
        }));
      }
    } catch {
      toast.error("To‘lov tarixi olinmadi!");
    }
  };

  const handleGroupChange = (groupId) => {
    const g = groups.find((gr) => gr.id === Number(groupId));
    setForm((f) => ({
      ...f,
      group_id: groupId,
      amount: g?.course?.price || "",
    }));
  };

  const handleAddPayment = async () => {
    if (!form.student_id || !form.group_id || !form.amount) {
      toast.error("Barcha maydonlarni to‘ldiring!");
      return;
    }
    try {
      await api.post("/payments", {
        student_id: Number(form.student_id),
        group_id: Number(form.group_id),
        amount: Number(form.amount),
        month: form.month,
      });
      toast.success("To‘lov qo‘shildi ✅");
      fetchAll();
      openHistory(selectedStudent);
    } catch {
      toast.error("Xatolik yuz berdi!");
    }
  };

  const grouped = students.map((s) => {
    const studentPays = payments.filter((p) => p.student?.id === s.id);
    const totalPaid = studentPays.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalDebt = studentPays.reduce(
      (sum, p) => sum + (p.debt_amount || 0),
      0
    );
    const latestMonth = studentPays[0]?.month;
    return { id: s.id, name: s.full_name, totalPaid, totalDebt, latestMonth };
  });

  return (
    <Box sx={{ p: 3 }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={600} mb={3}>
        💰 To‘lovlar boshqaruvi
      </Typography>

      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          type="month"
          size="small"
          label="Oy"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        />
        <Button
          variant="contained"
          startIcon={<Calculate />}
          onClick={handleCalculateMonthly}
        >
          Oylik qarzlarni hisobla
        </Button>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchAll}>
          Yangilash
        </Button>
      </Stack>

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : debtors.length > 0 ? (
        <>
          <Typography variant="h6" mb={1}>
            Qarzdorlar ro‘yxati ({debtors.length} nafar)
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 3, mb: 4 }}>
            <Table>
              <TableHead sx={{ bgcolor: "#f3f4f6" }}>
                <TableRow>
                  <TableCell>O‘quvchi</TableCell>
                  <TableCell>Guruh</TableCell>
                  <TableCell>Kurs</TableCell>
                  <TableCell align="right">Oylik to‘lov</TableCell>
                  <TableCell align="right">Avvalgi qarz</TableCell>
                  <TableCell align="right">Umumiy qarz</TableCell>
                  <TableCell>Holat</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {debtors.map((d, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{d.student_name}</TableCell>
                    <TableCell>{d.group_name}</TableCell>
                    <TableCell>{d.course_name}</TableCell>
                    <TableCell align="right">
                      {d.monthly_due.toLocaleString()} so‘m
                    </TableCell>
                    <TableCell align="right">
                      {d.previous_debt.toLocaleString()} so‘m
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="error">
                        {d.debt_amount.toLocaleString()} so‘m
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={d.status === "paid" ? "To‘langan" : "Qarzdor"}
                        color={d.status === "paid" ? "success" : "error"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <>
          <Typography variant="h6" mb={1}>
            Barcha o‘quvchilar
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: "#f3f4f6" }}>
                <TableRow>
                  <TableCell>
                    <b>O‘quvchi</b>
                  </TableCell>
                  <TableCell>
                    <b>So‘nggi oy</b>
                  </TableCell>
                  <TableCell align="right">
                    <b>Jami to‘lov</b>
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
                {grouped.map((s) => (
                  <TableRow
                    key={s.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => openHistory(s)}
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
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          s.totalDebt > 0
                            ? "Qarzdor"
                            : s.totalPaid > 0
                            ? "To‘langan"
                            : "To‘lov yo‘q"
                        }
                        color={
                          s.totalDebt > 0
                            ? "error"
                            : s.totalPaid > 0
                            ? "success"
                            : "default"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          sx={{
            bgcolor: "white",
            p: 3,
            borderRadius: 2,
            width: 500,
            mx: "auto",
            mt: 10,
            maxHeight: "85vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" mb={2}>
            {selectedStudent?.name} — To‘lov tarixi
          </Typography>

          {studentHistory.length ? (
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
                  {studentHistory.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell>{formatMonth(h.month)}</TableCell>
                      <TableCell align="right">
                        {h.amount.toLocaleString()} so‘m
                      </TableCell>
                      <TableCell align="right">
                        {h.debt_amount?.toLocaleString()} so‘m
                      </TableCell>
                      <TableCell>{h.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="gray" align="center" mt={2}>
              To‘lovlar topilmadi ☹️
            </Typography>
          )}

          <Typography variant="subtitle2" mt={3} mb={1}>
            ➕ Yangi to‘lov qo‘shish
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Guruh</InputLabel>
            <Select
              value={form.group_id}
              onChange={(e) => handleGroupChange(e.target.value)}
            >
              <MenuItem value="">Tanlang</MenuItem>
              {availableGroups.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.course?.title} — {g.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {form.group_id && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              Kurs narxi:{" "}
              <b>
                {groups
                  .find((gr) => gr.id === Number(form.group_id))
                  ?.course?.price.toLocaleString()}{" "}
                so‘m
              </b>
            </Typography>
          )}

          <TextField
            fullWidth
            size="small"
            type="month"
            label="Oy"
            sx={{ mb: 1 }}
            value={form.month}
            onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
          />
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Summa (so‘m)"
            sx={{ mb: 2 }}
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
