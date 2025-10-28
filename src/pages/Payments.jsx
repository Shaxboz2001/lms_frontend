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
  const [openHistory, setOpenHistory] = useState(false);
  const [openPayModal, setOpenPayModal] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [form, setForm] = useState({
    amount: "",
    student_id: "",
    description: "",
    month: "",
  });

  const [payAmount, setPayAmount] = useState("");

  // ============== FETCH DATA =================
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
      toast.error("O‘quvchilarni olishda xatolik!");
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Guruhlar olinmadi!");
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStudents();
    fetchGroups();
  }, []);

  // ============== FILTER =================
  const filteredPayments = selectedMonth
    ? payments.filter((p) => p.month === selectedMonth)
    : payments;

  // ============== ADD PAYMENT =================
  const handleAddPayment = async () => {
    if (!form.amount || !form.student_id || !form.month) {
      toast.error("Ma’lumotlarni to‘liq kiriting!");
      return;
    }
    try {
      await api.post("/payments", {
        amount: parseFloat(form.amount),
        student_id: parseInt(form.student_id),
        description: form.description,
        month: form.month,
      });
      toast.success("To‘lov muvaffaqiyatli qo‘shildi ✅");
      setOpenAdd(false);
      setForm({ amount: "", student_id: "", description: "", month: "" });
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xatolik yuz berdi!");
    }
  };

  // ✅ O‘QUVCHI TANLANGANDA avtomatik kurs narxini olish
  useEffect(() => {
    if (form.student_id) {
      const student = students.find((s) => s.id === Number(form.student_id));
      if (student) {
        const group = groups.find((g) =>
          g.students?.some((st) => st.id === student.id)
        );
        if (group?.course?.price) {
          setForm((prev) => ({ ...prev, amount: group.course.price }));
        }
      }
    }
  }, [form.student_id]);

  // ============== GENERATE DEBTS =================
  const handleGenerateDebts = async () => {
    try {
      const res = await api.post("/payments/generate-debts");
      toast.success(res.data.message);
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Qarz yozishda xatolik!");
    }
  };

  // ============== GET STUDENT HISTORY =================
  const fetchHistory = async (studentId) => {
    try {
      const res = await api.get(`/payments/student/${studentId}/history`);
      setHistoryData(res.data);
      setOpenHistory(true);
    } catch {
      toast.error("To‘lov tarixi topilmadi!");
    }
  };

  // ============== MARK AS PAID =================
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
      toast.error(
        err.response?.data?.detail || "To‘lovni yangilashda xatolik!"
      );
    }
  };

  // ============== EXPORT TO EXCEL =================
  const handleExportExcel = () => {
    if (!filteredPayments.length) {
      toast.error("Eksport qilinadigan ma’lumot yo‘q!");
      return;
    }

    const data = filteredPayments.map((p) => ({
      ID: p.id,
      Oquvchi: p.student?.full_name || p.student?.username || "-",
      Kurs: p.group?.course?.title || "-",
      Guruh: p.group?.name || "-",
      Oy: p.month,
      "To‘langan summa": p.amount?.toLocaleString() + " so‘m",
      Qarzdorlik: p.debt_amount?.toLocaleString() + " so‘m",
      Holat:
        p.status === "paid"
          ? "To‘langan"
          : p.status === "partial"
          ? "Qisman"
          : "To‘lanmagan",
      "To‘lov muddati": p.due_date ? p.due_date.split("T")[0] : "-",
      Izoh: p.description || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "To‘lovlar");
    XLSX.writeFile(
      wb,
      `Tolovlar_${selectedMonth || "barcha"}_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  };

  // ============== COLUMNS =================
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "student_name",
      headerName: "O‘quvchi",
      width: 200,
      valueGetter: (params) =>
        params.row?.student?.full_name || params.row?.student?.username || "-",
    },
    {
      field: "course_name",
      headerName: "Kurs",
      width: 180,
      valueGetter: (params) => params.row?.group?.course?.title || "-",
    },
    {
      field: "group_name",
      headerName: "Guruh",
      width: 160,
      valueGetter: (params) => params.row?.group?.name || "-",
    },
    {
      field: "month",
      headerName: "Oy",
      width: 120,
    },
    {
      field: "amount",
      headerName: "To‘langan",
      width: 130,
      valueFormatter: (params) => `${params.value?.toLocaleString() || 0} so‘m`,
    },
    {
      field: "debt_amount",
      headerName: "Qarzdorlik",
      width: 130,
      valueFormatter: (params) => `${params.value?.toLocaleString() || 0} so‘m`,
    },
    {
      field: "status",
      headerName: "Holat",
      width: 130,
      renderCell: (params) => (
        <span
          style={{
            color:
              params.value === "paid"
                ? "green"
                : params.value === "partial"
                ? "orange"
                : "red",
            fontWeight: 600,
          }}
        >
          {params.value === "paid"
            ? "To‘langan"
            : params.value === "partial"
            ? "Qisman"
            : "To‘lanmagan"}
        </span>
      ),
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
            size="small"
            color="success"
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
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={600} mb={3}>
        💸 To‘lovlar boshqaruvi
      </Typography>

      {/* FILTER va BUTTONLAR */}
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

      {/* DATAGRID */}
      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
          <Typography mt={1}>Yuklanmoqda...</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            height: 600,
            width: "100%",
            bgcolor: "white",
            borderRadius: 3,
            p: 1,
          }}
        >
          <DataGrid
            rows={filteredPayments}
            columns={columns}
            getRowId={(r) => r.id}
            pageSize={10}
            disableRowSelectionOnClick
          />
        </Box>
      )}

      {/* MODALLAR (To‘lov qo‘shish, Tarix, To‘lov belgilash) */}
      {/* ... (qolgan modal kodlari sizning oldingi versiyada qoladi, o‘zgartirishsiz) ... */}
    </Box>
  );
};

export default Payments;
