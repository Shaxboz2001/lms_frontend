// src/pages/Payments.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Paper,
  Chip,
  Modal,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  useMediaQuery,
  useTheme,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
} from "@mui/material";
import {
  Add,
  Refresh,
  FilterList,
  Calculate,
  Download,
  Payment as PaymentIcon,
} from "@mui/icons-material";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../services/api";
import * as XLSX from "xlsx";

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
const money = (v) => Number(v || 0).toLocaleString();

export default function Payments() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [filters, setFilters] = useState({
    student: "",
    group: "",
    course: "",
    month: "",
  });
  const [openModal, setOpenModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState(null);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [payForm, setPayForm] = useState({
    student_id: "",
    group_id: "",
    month: filterMonth,
    amount: "",
  });

  // ================= Fetch All =================
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, gRes, cRes] = await Promise.all([
        api.get("/payments"),
        api.get("/users"),
        api.get("/groups"),
        api.get("/courses"),
      ]);
      setPayments(pRes.data || []);
      setStudents(sRes.data.filter((u) => u.role === "student"));
      setGroups(gRes.data || []);
      setCourses(cRes.data || []);
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
      toast.success(res.data.message || "Hisoblash yakunlandi!");
      setDebtors(res.data.debtors || []);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Hisoblashda xato!");
    } finally {
      setLoading(false);
    }
  };

  // ================= Export Excel =================
  const exportToExcel = () => {
    if (debtors.length === 0) return toast.error("Qarzdorlar mavjud emas!");
    const ws = XLSX.utils.json_to_sheet(
      debtors.map((d) => ({
        "O‘quvchi": d.student_name,
        Guruh: d.group_name,
        Kurs: d.course_title,
        Qarzdorlik: d.debt_amount,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Qarzdorlar");
    XLSX.writeFile(wb, `qarzdorlar_${filterMonth}.xlsx`);
    toast.success("Excel fayl yuklab olindi ✅");
  };

  // ================= Student History =================
  const openHistory = async (student) => {
    setSelectedStudent(student);
    setOpenModal(true);
    setStudentHistory(null);
    setPayForm({
      student_id: student.id,
      group_id: "",
      month: filterMonth,
      amount: "",
    });

    try {
      const res = await api.get(`/payments/student/${student.id}`);
      setStudentHistory(res.data || null);
      const related = groups.filter((g) =>
        g.students?.some((st) => st.id === student.id)
      );
      setAvailableGroups(related);
      if (related.length === 1) {
        const g = related[0];
        setPayForm({
          student_id: student.id,
          group_id: g.id,
          month: filterMonth,
          amount: g.course?.price || "",
        });
      }
    } catch {
      toast.error("To‘lov tarixi olinmadi!");
    }
  };

  const handleGroupChange = (groupId) => {
    const g = groups.find((gr) => gr.id === Number(groupId));
    setPayForm((f) => ({
      ...f,
      group_id: groupId,
      amount: g?.course?.price || "",
    }));
  };

  const handleAddPayment = async () => {
    if (!payForm.student_id || !payForm.group_id || !payForm.amount)
      return toast.error("Barcha maydonlarni to‘ldiring!");
    try {
      await api.post("/payments", {
        student_id: Number(payForm.student_id),
        group_id: Number(payForm.group_id),
        amount: Number(payForm.amount),
        month: payForm.month,
      });
      toast.success("To‘lov qo‘shildi ✅");
      fetchAll();
      openHistory(selectedStudent);
    } catch {
      toast.error("Xatolik yuz berdi!");
    }
  };

  // ================= Filtering (frontend) =================
  const filteredPayments = payments.filter((p) => {
    const studentName = p.student?.full_name?.toLowerCase() || "";
    const groupName = p.group?.name?.toLowerCase() || "";
    const courseName = p.group?.course?.title?.toLowerCase() || "";
    const month = p.month || "";
    return (
      (!filters.student ||
        studentName.includes(filters.student.toLowerCase())) &&
      (!filters.group || groupName.includes(filters.group.toLowerCase())) &&
      (!filters.course || courseName.includes(filters.course.toLowerCase())) &&
      (!filters.month || month === filters.month)
    );
  });

  // ================= UI =================
  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      <Toaster position="top-right" />
      <Typography
        variant={isMobile ? "h6" : "h5"}
        fontWeight={600}
        mb={3}
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <PaymentIcon color="primary" /> To‘lovlar boshqaruvi
      </Typography>

      {/* Filtrlar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
        >
          <TextField
            label="O‘quvchi"
            size="small"
            value={filters.student}
            onChange={(e) =>
              setFilters({ ...filters, student: e.target.value })
            }
            sx={{ flex: 1, minWidth: 180 }}
          />

          <FormControl size="small" sx={{ flex: 1, minWidth: 180 }}>
            <InputLabel>Kurs</InputLabel>
            <Select
              value={filters.course}
              onChange={(e) =>
                setFilters({ ...filters, course: e.target.value })
              }
              label="Kurs"
            >
              <MenuItem value="">Barchasi</MenuItem>
              {courses.map((c) => (
                <MenuItem key={c.id} value={c.title}>
                  {c.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ flex: 1, minWidth: 180 }}>
            <InputLabel>Guruh</InputLabel>
            <Select
              value={filters.group}
              onChange={(e) =>
                setFilters({ ...filters, group: e.target.value })
              }
              label="Guruh"
            >
              <MenuItem value="">Barchasi</MenuItem>
              {groups.map((g) => (
                <MenuItem key={g.id} value={g.name}>
                  {g.name} ({g.course?.title})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="month"
            size="small"
            label="Oy"
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            sx={{ flex: 1, minWidth: 160 }}
          />

          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() =>
              setFilters({ student: "", group: "", course: "", month: "" })
            }
          >
            Tozalash
          </Button>
        </Stack>
      </Paper>

      {/* Hisoblash */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
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
        {debtors.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportToExcel}
          >
            Excel
          </Button>
        )}
      </Stack>

      {/* Jadval */}
      {loading ? (
        <Box textAlign="center" mt={5}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Typography variant="h6" mb={2}>
            📋 Barcha to‘lovlar
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f3f4f6" }}>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>O‘quvchi</TableCell>
                  <TableCell>Telefon</TableCell>
                  <TableCell>Kurs</TableCell>
                  <TableCell>Guruh</TableCell>
                  <TableCell>Oy</TableCell>
                  <TableCell align="right">To‘lagan</TableCell>
                  <TableCell align="right">Qarzdorlik</TableCell>
                  <TableCell>Vaqt</TableCell>
                  <TableCell>Holat</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.map((p, i) => (
                  <TableRow
                    key={p.id}
                    hover
                    onClick={() => openHistory(p.student)}
                    sx={{
                      cursor: "pointer",
                      bgcolor:
                        p.debt_amount > 0
                          ? "#fff0f0"
                          : p.amount > 0
                          ? "#f9fff9"
                          : "inherit",
                    }}
                  >
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{p.student?.full_name}</TableCell>
                    <TableCell>{p.student?.phone || "-"}</TableCell>
                    <TableCell>{p.group?.course?.title || "-"}</TableCell>
                    <TableCell>{p.group?.name || "-"}</TableCell>
                    <TableCell>{formatMonth(p.month)}</TableCell>
                    <TableCell align="right">{money(p.amount)} so‘m</TableCell>
                    <TableCell align="right" sx={{ color: "red" }}>
                      {money(p.debt_amount)} so‘m
                    </TableCell>
                    <TableCell>
                      {new Date(p.created_at).toLocaleString("uz-UZ", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          p.debt_amount > 0
                            ? "Qarzdor"
                            : p.amount > 0
                            ? "To‘langan"
                            : "Yo‘q"
                        }
                        color={
                          p.debt_amount > 0
                            ? "error"
                            : p.amount > 0
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
        </Paper>
      )}

      {/* Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          sx={{
            bgcolor: "white",
            p: 3,
            borderRadius: 2,
            width: isMobile ? "90%" : 600,
            mx: "auto",
            mt: isMobile ? "20%" : 10,
            maxHeight: "85vh",
            overflowY: "auto",
          }}
        >
          {studentHistory ? (
            <>
              <Typography variant="h6" mb={2}>
                {studentHistory.student_name} — To‘lov tarixi
              </Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2">
                  Kurs: <b>{studentHistory.course_name}</b>
                </Typography>
                <Typography variant="body2">
                  Guruh: <b>{studentHistory.group_name}</b>
                </Typography>
                <Typography color="success.main">
                  Jami to‘lov: <b>{money(studentHistory.total_paid)} so‘m</b>
                </Typography>
                <Typography color="error">
                  Qarzdorlik: <b>{money(studentHistory.total_debt)} so‘m</b>
                </Typography>
                <Typography color="primary">
                  Balans: <b>{money(studentHistory.balance)} so‘m</b>
                </Typography>
              </Paper>

              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>📅 Sana</TableCell>
                      <TableCell>Oy</TableCell>
                      <TableCell align="right">💰 To‘lov</TableCell>
                      <TableCell align="right">Qarzdorlik</TableCell>
                      <TableCell align="right">Oy uchun</TableCell>
                      <TableCell>Holat</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentHistory.history.map((h, i) => (
                      <TableRow
                        key={i}
                        sx={{
                          bgcolor:
                            h.status === "paid"
                              ? "#eaffea"
                              : h.debt_amount > 0
                              ? "#fff0f0"
                              : "inherit",
                        }}
                      >
                        <TableCell>
                          {new Date(h.created_at).toLocaleString("uz-UZ", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>{formatMonth(h.month)}</TableCell>
                        <TableCell align="right">
                          {money(h.amount)} so‘m
                        </TableCell>
                        <TableCell align="right" sx={{ color: "red" }}>
                          {money(h.debt_amount)} so‘m
                        </TableCell>
                        <TableCell align="right">
                          {money(h.monthly_due)} so‘m
                        </TableCell>
                        <TableCell>
                          {h.status === "paid"
                            ? "✅ To‘langan"
                            : h.status === "partial"
                            ? "⚠️ Qisman"
                            : "❌ Yo‘q"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, textAlign: "right" }}>
                <Typography fontWeight={600}>
                  Jami to‘langan:{" "}
                  {money(
                    studentHistory.history.reduce(
                      (sum, h) => sum + (h.amount || 0),
                      0
                    )
                  )}{" "}
                  so‘m
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" mb={1}>
                ➕ Yangi to‘lov qo‘shish
              </Typography>

              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Guruh</InputLabel>
                <Select
                  value={payForm.group_id}
                  onChange={(e) => handleGroupChange(e.target.value)}
                  label="Guruh"
                >
                  {availableGroups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.name} ({g.course?.title})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                type="number"
                label="Summa"
                value={payForm.amount}
                onChange={(e) =>
                  setPayForm({ ...payForm, amount: e.target.value })
                }
                sx={{ mb: 2 }}
              />

              <Button
                fullWidth
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddPayment}
              >
                To‘lovni qo‘shish
              </Button>
            </>
          ) : (
            <Box textAlign="center" p={3}>
              <CircularProgress />
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
}
