import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Modal,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import { api } from "../services/api";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(false);

  const [openAdd, setOpenAdd] = useState(false);
  const [openPayModal, setOpenPayModal] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);

  const [availableGroups, setAvailableGroups] = useState([]);
  const [form, setForm] = useState({
    student_id: "",
    group_id: "",
    amount: "",
    description: "",
    month: "",
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [historyData, setHistoryData] = useState(null);

  // Fetch
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/payments");
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("To‘lovlarni yuklashda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get("/users");
      setStudents(res.data.filter((u) => u.role === "student"));
    } catch {
      toast.error("O‘quvchilarni yuklashda xatolik!");
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Guruhlarni olishda xatolik!");
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStudents();
    fetchGroups();
  }, []);

  const filteredPayments = selectedMonth
    ? payments.filter((p) => p.month === selectedMonth)
    : payments;

  // 🧩 Student tanlanganda guruhlarni olish
  useEffect(() => {
    if (form.student_id) {
      const student = students.find((s) => s.id === Number(form.student_id));
      if (student) {
        const studentGroups = groups.filter((g) =>
          g.students?.some((st) => st.id === student.id)
        );
        setAvailableGroups(studentGroups);
      }
    } else {
      setAvailableGroups([]);
    }
  }, [form.student_id, groups]);

  // 🟢 To‘lov qo‘shish
  const handleAddPayment = async () => {
    if (!form.student_id || !form.group_id || !form.amount || !form.month) {
      toast.error("Barcha maydonlarni to‘ldiring!");
      return;
    }
    try {
      await api.post("/payments", {
        student_id: parseInt(form.student_id),
        group_id: parseInt(form.group_id),
        amount: parseFloat(form.amount),
        description: form.description,
        month: form.month,
      });
      toast.success("To‘lov muvaffaqiyatli qo‘shildi ✅");
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
      toast.error(err.response?.data?.detail || "Xatolik!");
    }
  };

  // 💰 To‘lovni yangilash
  const handleMarkPaid = async () => {
    if (!selectedPayment?.id || !payAmount) {
      toast.error("Summani kiriting!");
      return;
    }
    try {
      await api.put(`/payments/mark-paid/${selectedPayment.id}`, {
        amount: parseFloat(payAmount),
      });
      toast.success("To‘lov yangilandi ✅");
      setOpenPayModal(false);
      setPayAmount("");
      setSelectedPayment(null);
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xatolik!");
    }
  };

  // 📜 Tarix olish
  const fetchHistory = async (studentId) => {
    try {
      const res = await api.get(`/payments/student/${studentId}/history`);
      setHistoryData(res.data);
      setOpenHistory(true);
    } catch {
      toast.error("Tarix topilmadi!");
    }
  };

  // ⚙️ Qarz yozish
  const handleGenerateDebts = async () => {
    try {
      const res = await api.post("/payments/generate-debts");
      toast.success(res.data.message);
      fetchPayments();
    } catch {
      toast.error("Qarz yozishda xatolik!");
    }
  };

  // 📤 Excel eksport
  const handleExportExcel = () => {
    if (!filteredPayments.length) {
      toast.error("Eksport qilinadigan ma’lumot yo‘q!");
      return;
    }
    const data = filteredPayments.map((p) => ({
      ID: p.id,
      Oquvchi: p.student?.full_name || "-",
      Kurs: p.group?.course?.title || "-",
      Guruh: p.group?.name || "-",
      Oy: p.month,
      "To‘langan summa": `${p.amount?.toLocaleString()} so‘m`,
      Izoh: p.description || "-",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "To‘lovlar");
    XLSX.writeFile(wb, `Tolovlar_${selectedMonth || "barcha"}.xlsx`);
  };

  // 📋 Jadval ustunlari
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "student_name",
      headerName: "O‘quvchi",
      width: 200,
      valueGetter: (p) =>
        p.row?.student?.full_name || p.row?.student?.username || "-",
    },
    {
      field: "course_name",
      headerName: "Kurs",
      width: 180,
      valueGetter: (p) => p.row?.group?.course?.title || "-",
    },
    {
      field: "group_name",
      headerName: "Guruh",
      width: 160,
      valueGetter: (p) => p.row?.group?.name || "-",
    },
    {
      field: "month",
      headerName: "Oy",
      width: 120,
    },
    {
      field: "amount",
      headerName: "To‘langan (so‘m)",
      width: 150,
      valueFormatter: (p) => `${p.value?.toLocaleString() || 0} so‘m`,
    },
    {
      field: "description",
      headerName: "Izoh",
      width: 180,
    },
    {
      field: "actions",
      headerName: "Amallar",
      width: 230,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          {params.row?.student_id && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => fetchHistory(params.row.student_id)}
            >
              Tarix
            </Button>
          )}
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={() => {
              setSelectedPayment(params.row);
              setOpenPayModal(true);
            }}
          >
            To‘landi
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={600} mb={3}>
        💸 To‘lovlar boshqaruvi
      </Typography>

      {/* FILTER */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={4}>
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
                {m}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={8} textAlign="right">
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

      {/* JADVAL */}
      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ height: 600, bgcolor: "white", borderRadius: 2 }}>
          <DataGrid
            rows={filteredPayments}
            columns={columns}
            getRowId={(r) => r.id}
            pageSize={10}
            disableRowSelectionOnClick
          />
        </Box>
      )}

      {/* ADD PAYMENT MODAL */}
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
            ➕ To‘lov qo‘shish
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>O‘quvchi</InputLabel>
            <Select
              value={form.student_id}
              label="O‘quvchi"
              onChange={(e) =>
                setForm((prev) => ({ ...prev, student_id: e.target.value }))
              }
            >
              {students.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.full_name} ({s.phone})
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
                  amount: g?.course?.price || "",
                  description: g?.course?.title || "",
                }));
              }}
            >
              {availableGroups.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.course?.title} — {g.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Oy (YYYY-MM)"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            value={form.month}
            onChange={(e) => setForm({ ...form, month: e.target.value })}
          />
          <TextField
            label="Summa"
            fullWidth
            type="number"
            size="small"
            sx={{ mb: 2 }}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <TextField
            label="Izoh"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Button fullWidth variant="contained" onClick={handleAddPayment}>
            Saqlash
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default Payments;
