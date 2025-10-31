// src/pages/Payments.js
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
  useMediaQuery,
  useTheme,
  Divider,
} from "@mui/material";
import {
  Add,
  Refresh,
  FilterList,
  Calculate,
  Download,
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
  const [studentHistory, setStudentHistory] = useState([]);
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
        Kurs: d.course_name,
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
    setStudentHistory([]);
    setPayForm({
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

  // 🔍 Student filtering by group/course
  const filteredStudents = students.filter((s) => {
    const fullName = s.full_name.toLowerCase();
    const studentGroups = groups.filter((g) =>
      g.students?.some((st) => st.id === s.id)
    );
    const studentCourses = studentGroups.map(
      (g) => g.course?.title?.toLowerCase() || ""
    );

    const matchName =
      !filters.student || fullName.includes(filters.student.toLowerCase());
    const matchGroup =
      !filters.group ||
      studentGroups.some((g) =>
        g.name.toLowerCase().includes(filters.group.toLowerCase())
      );
    const matchCourse =
      !filters.course ||
      studentCourses.some((title) =>
        title.includes(filters.course.toLowerCase())
      );

    return matchName && matchGroup && matchCourse;
  });

  const grouped = filteredStudents.map((s) => {
    const studentPays = filteredPayments.filter((p) => p.student?.id === s.id);
    const totalPaid = studentPays.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalDebt = studentPays.reduce(
      (sum, p) => sum + (p.debt_amount || 0),
      0
    );
    const latestMonth = studentPays[0]?.month;
    return { id: s.id, name: s.full_name, totalPaid, totalDebt, latestMonth };
  });

  // ================= UI =================
  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      <Toaster position="top-right" />
      <Typography variant={isMobile ? "h6" : "h5"} fontWeight={600} mb={2}>
        💰 To‘lovlar boshqaruvi
      </Typography>

      {/* Filtrlar */}
      <Stack direction="row" spacing={2} flexWrap="wrap" mb={2}>
        <TextField
          label="O‘quvchi"
          size="small"
          value={filters.student}
          onChange={(e) => setFilters({ ...filters, student: e.target.value })}
          sx={{ minWidth: 180 }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Kurs</InputLabel>
          <Select
            value={filters.course}
            onChange={(e) => setFilters({ ...filters, course: e.target.value })}
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

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Guruh</InputLabel>
          <Select
            value={filters.group}
            onChange={(e) => setFilters({ ...filters, group: e.target.value })}
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
          sx={{ minWidth: 160 }}
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

      {/* Hisoblash va eksport */}
      <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
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
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Qarzdorlar */}
          {debtors.length > 0 && (
            <>
              <Typography variant="h6" mb={1}>
                ⚠️ Qarzdorlar ({debtors.length} nafar)
              </Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 3, mb: 4 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f3f4f6" }}>
                    <TableRow>
                      <TableCell>O‘quvchi</TableCell>
                      <TableCell>Guruh</TableCell>
                      <TableCell>Kurs</TableCell>
                      <TableCell align="right">Qarzdorlik</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {debtors.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell>{d.student_name}</TableCell>
                        <TableCell>{d.group_name}</TableCell>
                        <TableCell>{d.course_name}</TableCell>
                        <TableCell align="right" sx={{ color: "red" }}>
                          {money(d.debt_amount)} so‘m
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* Barcha to‘lovlar */}
          <Typography variant="h6" mb={1}>
            📋 Barcha to‘lovlar
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f3f4f6" }}>
                <TableRow>
                  <TableCell>O‘quvchi</TableCell>
                  <TableCell>So‘nggi oy</TableCell>
                  <TableCell align="right">Jami to‘lov</TableCell>
                  <TableCell align="right">Qarzdorlik</TableCell>
                  <TableCell>Holat</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grouped.map((s) => (
                  <TableRow key={s.id} hover onClick={() => openHistory(s)}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{formatMonth(s.latestMonth)}</TableCell>
                    <TableCell align="right">
                      {money(s.totalPaid)} so‘m
                    </TableCell>
                    <TableCell align="right" sx={{ color: "red" }}>
                      {money(s.totalDebt)} so‘m
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          s.totalDebt > 0
                            ? "Qarzdor"
                            : s.totalPaid > 0
                            ? "To‘langan"
                            : "Yo‘q"
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

      {/* Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          sx={{
            bgcolor: "white",
            p: 3,
            borderRadius: 2,
            width: isMobile ? "90%" : 500,
            mx: "auto",
            mt: isMobile ? "20%" : 10,
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
                    <TableRow
                      key={i}
                      sx={{
                        bgcolor: h.debt_amount > 0 ? "#ffe5e5" : "inherit",
                      }}
                    >
                      <TableCell>{formatMonth(h.month)}</TableCell>
                      <TableCell align="right">
                        {money(h.amount)} so‘m
                      </TableCell>
                      <TableCell align="right" sx={{ color: "red" }}>
                        {money(h.debt_amount)} so‘m
                      </TableCell>
                      <TableCell>{h.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography align="center" color="gray" mt={2}>
              To‘lovlar topilmadi ☹️
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" mb={1}>
            ➕ Yangi to‘lov qo‘shish
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Guruh</InputLabel>
            <Select
              value={payForm.group_id}
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

          {payForm.group_id && (
            <Typography variant="body2" mb={1}>
              Kurs narxi:{" "}
              <b>
                {money(
                  groups.find((gr) => gr.id === Number(payForm.group_id))
                    ?.course?.price
                )}{" "}
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
            value={payForm.month}
            onChange={(e) =>
              setPayForm((f) => ({ ...f, month: e.target.value }))
            }
          />

          <TextField
            fullWidth
            size="small"
            type="number"
            label="Summa (so‘m)"
            sx={{ mb: 2 }}
            value={payForm.amount}
            onChange={(e) =>
              setPayForm((f) => ({ ...f, amount: e.target.value }))
            }
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
