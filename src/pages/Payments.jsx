import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Button,
  Modal,
  TextField,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { api } from "../services/api";
import toast, { Toaster } from "react-hot-toast";

const Payment = () => {
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Load students
  const fetchStudents = async () => {
    try {
      const res = await api.get("/users");
      setStudents(res.data.filter((u) => u.role === "student"));
    } catch {
      toast.error("O‘quvchilarni yuklashda xatolik!");
    }
  };

  // 🔹 Load all payments
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/payments");
      setPayments(res.data);
    } catch {
      toast.error("To‘lovlarni yuklashda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchPayments();
  }, []);

  // 🔹 Filter function
  const filteredPayments = payments.filter((p) => {
    return (
      (!selectedMonth || p.month === selectedMonth) &&
      (!selectedStatus || p.status === selectedStatus) &&
      (!selectedStudent || p.student?.id === selectedStudent)
    );
  });

  // 🔹 Calculate summary
  const totalPaid = filteredPayments.reduce((a, b) => a + (b.amount || 0), 0);
  const totalDebt = filteredPayments.reduce(
    (a, b) => a + (b.debt_amount || 0),
    0
  );

  // 🔹 Open modal for adding payment
  const handleOpenModal = (payment) => {
    setSelectedPayment(payment);
    setPayAmount("");
    setOpenModal(true);
  };

  // 🔹 Save payment
  const handlePay = async () => {
    if (!selectedPayment) return;
    if (!payAmount || isNaN(payAmount) || payAmount <= 0)
      return toast.error("To‘lov summasini kiriting!");

    try {
      const res = await api.put(`/payments/mark-paid/${selectedPayment.id}`, {
        amount: parseFloat(payAmount),
      });
      toast.success("To‘lov qo‘shildi ✅");
      fetchPayments();
      setOpenModal(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "To‘lovni qo‘shishda xato!");
    }
  };

  // 🔹 Generate debts
  const handleGenerateDebts = async () => {
    try {
      const res = await api.post("/payments/generate-debts");
      toast.success(res.data.message);
      fetchPayments();
    } catch {
      toast.error("Qarzlarni generatsiya qilishda xato!");
    }
  };

  // 🔹 Columns for DataGrid
  const columns = [
    { field: "month", headerName: "Oy", flex: 1 },
    {
      field: "student",
      headerName: "O‘quvchi",
      flex: 1.2,
      valueGetter: (params) => params.row.student?.full_name,
    },
    {
      field: "group",
      headerName: "Guruh",
      flex: 1,
      valueGetter: (params) => params.row.group?.name,
    },
    {
      field: "amount",
      headerName: "To‘langan (so‘m)",
      flex: 1,
      valueFormatter: (p) => p.value?.toLocaleString(),
    },
    {
      field: "debt_amount",
      headerName: "Qarz (so‘m)",
      flex: 1,
      valueFormatter: (p) => p.value?.toLocaleString(),
    },
    {
      field: "status",
      headerName: "Holat",
      flex: 0.8,
      renderCell: (params) => {
        const color =
          params.value === "paid"
            ? "#2e7d32"
            : params.value === "partial"
            ? "#ed6c02"
            : "#d32f2f";
        return (
          <span style={{ color, fontWeight: 600 }}>
            {params.value === "paid"
              ? "To‘langan"
              : params.value === "partial"
              ? "Qisman"
              : "To‘lanmagan"}
          </span>
        );
      },
    },
    {
      field: "actions",
      headerName: "Amal",
      flex: 0.8,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => handleOpenModal(params.row)}
        >
          💵 To‘lov
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={600} mb={3}>
        💸 To‘lovlar paneli
      </Typography>

      {/* Filterlar */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>O‘quvchi</InputLabel>
            <Select
              value={selectedStudent}
              label="O‘quvchi"
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <MenuItem value="">Barchasi</MenuItem>
              {students.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.full_name || s.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Holat</InputLabel>
            <Select
              value={selectedStatus}
              label="Holat"
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <MenuItem value="">Barchasi</MenuItem>
              <MenuItem value="paid">To‘langan</MenuItem>
              <MenuItem value="partial">Qisman</MenuItem>
              <MenuItem value="unpaid">To‘lanmagan</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Oy</InputLabel>
            <Select
              value={selectedMonth}
              label="Oy"
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <MenuItem value="">Barchasi</MenuItem>
              {[
                "2025-01",
                "2025-02",
                "2025-03",
                "2025-04",
                "2025-05",
                "2025-06",
                "2025-07",
                "2025-08",
                "2025-09",
                "2025-10",
                "2025-11",
                "2025-12",
              ].map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4} md={3}>
          <Button
            onClick={handleGenerateDebts}
            variant="contained"
            color="secondary"
            fullWidth
          >
            🔄 Qarzdorlarni generatsiya qilish
          </Button>
        </Grid>
      </Grid>

      {/* Statistik kartalar */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "#e8fff3", borderRadius: 3 }}>
            <CardContent>
              <Typography fontWeight={500}>💰 Jami to‘langan</Typography>
              <Typography variant="h6" fontWeight={600}>
                {totalPaid.toLocaleString()} so‘m
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "#fff6e6", borderRadius: 3 }}>
            <CardContent>
              <Typography fontWeight={500}>⚠️ Qarzdorlik</Typography>
              <Typography variant="h6" fontWeight={600}>
                {totalDebt.toLocaleString()} so‘m
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DataGrid jadvali */}
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <DataGrid
          autoHeight
          rows={filteredPayments}
          columns={columns}
          getRowId={(row) => row.id}
          pageSize={10}
          rowsPerPageOptions={[10, 20, 50]}
          loading={loading}
        />
      </Paper>

      {/* To‘lov qo‘shish Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          sx={{
            p: 4,
            bgcolor: "white",
            borderRadius: 3,
            width: { xs: "90%", sm: 400 },
            mx: "auto",
            mt: "15%",
          }}
        >
          <Typography variant="h6" mb={2} fontWeight={600}>
            💵 To‘lov qo‘shish
          </Typography>
          <Typography mb={1}>
            {selectedPayment?.student?.full_name} — {selectedPayment?.month}
          </Typography>
          <TextField
            label="To‘lov summasi (so‘m)"
            type="number"
            fullWidth
            size="small"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            onClick={handlePay}
          >
            Tasdiqlash
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default Payment;
