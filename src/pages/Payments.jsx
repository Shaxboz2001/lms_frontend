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
import { api } from "../services/api";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [form, setForm] = useState({
    amount: "",
    student_id: "",
    description: "",
    month: "",
  });

  // ============== FETCH DATA =================
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

  useEffect(() => {
    fetchPayments();
    fetchStudents();
  }, []);

  // ============== FILTER =================
  const filteredPayments = selectedMonth
    ? payments.filter((p) => p?.month === selectedMonth)
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
      console.error(err);
      toast.error(err.response?.data?.detail || "Xatolik yuz berdi!");
    }
  };

  // ============== GENERATE DEBTS =================
  const handleGenerateDebts = async () => {
    try {
      const res = await api.post("/payments/generate-debts");
      toast.success(res.data?.message || "Qarz yozildi");
      fetchPayments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Qarz yozishda xatolik!");
    }
  };

  // ============== GET STUDENT HISTORY =================
  const fetchHistory = async (studentId) => {
    if (!studentId) return;
    try {
      setLoading(true);
      const res = await api.get(`/payments/student/${studentId}/history`);
      setHistoryData(res.data);
      setOpenHistory(true);
    } catch (err) {
      console.error(err);
      toast.error("To‘lov tarixi topilmadi!");
      setHistoryData(null);
    } finally {
      setLoading(false);
    }
  };

  // helper: safe date string (some backends return date ISO or string)
  const safeDate = (val) => {
    if (!val) return "-";
    try {
      // if it's already YYYY-MM-DD or ISO, normalize to YYYY-MM-DD
      const d = new Date(val);
      if (!isNaN(d)) {
        return d.toISOString().split("T")[0];
      }
      return String(val).split("T")[0];
    } catch {
      return String(val);
    }
  };

  // ============== COLUMNS =================
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "student_name",
      headerName: "O‘quvchi",
      width: 200,
      valueGetter: (params) =>
        params?.row?.student?.full_name ||
        params?.row?.student?.username ||
        "-",
    },
    {
      field: "course_name",
      headerName: "Kurs",
      width: 180,
      valueGetter: (params) => params?.row?.group?.course?.title || "-",
    },
    {
      field: "group_name",
      headerName: "Guruh",
      width: 160,
      valueGetter: (params) => params?.row?.group?.name || "-",
    },
    {
      field: "month",
      headerName: "Oy",
      width: 120,
      valueGetter: (params) => params?.row?.month || "-",
    },
    {
      field: "amount",
      headerName: "To‘langan",
      width: 130,
      valueGetter: (params) => params?.row?.amount ?? 0,
      valueFormatter: (params) =>
        `${(params?.value ?? 0).toLocaleString()} so‘m`,
    },
    {
      field: "debt_amount",
      headerName: "Qarzdorlik",
      width: 130,
      valueGetter: (params) => params?.row?.debt_amount ?? 0,
      valueFormatter: (params) =>
        `${(params?.value ?? 0).toLocaleString()} so‘m`,
    },
    {
      field: "status",
      headerName: "Holat",
      width: 130,
      valueGetter: (params) => params?.row?.status || "unpaid",
      renderCell: (params) => {
        const v = params?.value;
        const text =
          v === "paid"
            ? "To‘langan"
            : v === "partial"
            ? "Qisman"
            : "To‘lanmagan";
        const color =
          v === "paid" ? "green" : v === "partial" ? "orange" : "red";
        return <span style={{ color, fontWeight: 600 }}>{text}</span>;
      },
    },
    {
      field: "due_date",
      headerName: "Muddati",
      width: 150,
      valueGetter: (params) => safeDate(params?.row?.due_date),
    },
    {
      field: "actions",
      headerName: "Amallar",
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) =>
        params?.row?.student_id ? (
          <Button
            variant="outlined"
            size="small"
            onClick={() => fetchHistory(params.row.student_id)}
          >
            Tarix
          </Button>
        ) : (
          <span style={{ color: "#777" }}>—</span>
        ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={600} mb={3}>
        💸 To‘lovlar boshqaruvi
      </Typography>

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
            {[...new Set(payments.map((p) => p?.month).filter(Boolean))].map(
              (m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              )
            )}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={8} textAlign="right">
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
            getRowId={(r) =>
              r?.id ??
              `${r?.student_id ?? "s"}-${r?.month ?? "m"}-${Math.random()}`
            }
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight={false}
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
              onChange={(e) => setForm({ ...form, student_id: e.target.value })}
            >
              <MenuItem value="">Tanlang</MenuItem>
              {students.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.full_name || s.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Oy (YYYY-MM)"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            placeholder="Masalan: 2025-11"
            value={form.month}
            onChange={(e) => setForm({ ...form, month: e.target.value })}
          />

          <TextField
            label="Summa"
            fullWidth
            size="small"
            type="number"
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

      {/* HISTORY MODAL */}
      <Modal open={openHistory} onClose={() => setOpenHistory(false)}>
        <Box
          sx={{
            bgcolor: "white",
            p: 3,
            borderRadius: 2,
            width: { xs: "90%", md: 600 },
            mx: "auto",
            mt: 8,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" mb={2}>
            📜 {historyData?.student_name || "O‘quvchi"} to‘lov tarixi
          </Typography>
          {historyData ? (
            <>
              <Typography>
                Jami to‘langan:{" "}
                <strong>
                  {(historyData.total_paid ?? 0).toLocaleString()} so‘m
                </strong>
              </Typography>
              <Typography mb={2}>
                Qarzdorlik:{" "}
                <strong>
                  {(historyData.total_debt ?? 0).toLocaleString()} so‘m
                </strong>
              </Typography>
              {(historyData.history || []).map((h, i) => (
                <Box
                  key={i}
                  sx={{
                    borderBottom: "1px solid #eee",
                    py: 1,
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">
                    <b>{h.month}</b> — {h.course_name || "-"} /{" "}
                    {h.group_name || "-"}
                  </Typography>
                  <Typography variant="body2">
                    To‘langan: {(h.amount ?? 0).toLocaleString()} so‘m
                  </Typography>
                  <Typography variant="body2">
                    Qarzdorlik: {(h.debt_amount ?? 0).toLocaleString()} so‘m
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
                    Holat:{" "}
                    {h.status === "paid"
                      ? "To‘langan"
                      : h.status === "partial"
                      ? "Qisman"
                      : "To‘lanmagan"}
                  </Typography>
                </Box>
              ))}
            </>
          ) : (
            <Typography>Ma’lumot yo‘q</Typography>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default Payments;
