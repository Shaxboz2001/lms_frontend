import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { api } from "../services/api";
import toast, { Toaster } from "react-hot-toast";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [showDebtors, setShowDebtors] = useState(false);

  // modallar
  const [openAdd, setOpenAdd] = useState(false);
  const [openPay, setOpenPay] = useState(false);

  // yangi to‘lov formasi
  const [addStudent, setAddStudent] = useState("");
  const [addGroup, setAddGroup] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addMonth, setAddMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [saving, setSaving] = useState(false);

  // mavjud to‘lovga to‘lov kiritish (update)
  const [currentPayment, setCurrentPayment] = useState(null);
  const [payAmount, setPayAmount] = useState("");

  // ------------------------------------------
  // MA'LUMOTLARNI YUKLASH
  // ------------------------------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      const [payRes, usersRes, grpRes] = await Promise.all([
        api.get("/payments"),
        api.get("/users"),
        api.get("/groups"),
      ]);
      setPayments(payRes.data || []);
      setStudents((usersRes.data || []).filter((u) => u.role === "student"));
      setGroups(grpRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Ma'lumotlarni yuklashda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ------------------------------------------
  // XAVFSIZ NOM OLISH FUNKSIYALARI
  // ------------------------------------------
  const getStudentName = (row) => {
    if (!row) return "—";
    return (
      row?.student?.full_name ||
      row?.student?.username ||
      students.find((x) => x.id === row.student_id)?.full_name ||
      students.find((x) => x.id === row.student_id)?.username ||
      "—"
    );
  };

  const getGroupName = (row) => {
    if (!row) return "—";
    return (
      row?.group?.name || groups.find((x) => x.id === row.group_id)?.name || "—"
    );
  };

  // ------------------------------------------
  // FILTERLAR
  // ------------------------------------------
  const uniqueMonths = Array.from(
    new Set(payments.map((p) => p?.month).filter(Boolean))
  )
    .sort()
    .reverse();

  const filteredPayments = payments.filter((p) => {
    if (!p) return false;
    if (selectedMonth && p.month !== selectedMonth) return false;
    if (showDebtors && p.status === "paid") return false;
    return true;
  });

  const totalPaid = filteredPayments.reduce(
    (s, p) => s + (Number(p?.amount) || 0),
    0
  );
  const totalDebt = filteredPayments.reduce(
    (s, p) => s + (Number(p?.debt_amount) || 0),
    0
  );

  // ------------------------------------------
  // YANGI TO‘LOV QO‘SHISH
  // ------------------------------------------
  const handleAddPayment = async () => {
    if (!addStudent || !addGroup || !addAmount) {
      toast.error("Barcha maydonlarni to‘ldiring!");
      return;
    }
    try {
      setSaving(true);
      await api.post("/payments", {
        amount: Number(addAmount),
        description: addDescription,
        student_id: Number(addStudent),
        group_id: Number(addGroup),
        month: addMonth,
        status: "paid",
      });
      toast.success("To‘lov qo‘shildi ✅");
      setOpenAdd(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------
  // Mavjud to‘lovga qo‘shimcha to‘lov
  // ------------------------------------------
  const handleMarkPaid = async () => {
    if (!currentPayment?.id || !payAmount) return;
    try {
      await api.put(`/payments/mark-paid/${currentPayment.id}`, {
        amount: Number(payAmount),
      });
      toast.success("To‘lov yangilandi ✅");
      setOpenPay(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Yangilashda xatolik");
    }
  };

  // ------------------------------------------
  // Avtomatik qarz yaratish
  // ------------------------------------------
  const handleGenerateDebts = async () => {
    try {
      const res = await api.post("/payments/generate-debts");
      toast.success(res.data.message || "Qarzlar yaratildi ✅");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Qarz yaratishda xatolik!");
    }
  };

  // ------------------------------------------
  // Jadval ustunlari
  // ------------------------------------------
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "student",
      headerName: "O‘quvchi",
      flex: 1,
      valueGetter: (params) => getStudentName(params?.row),
    },
    {
      field: "group",
      headerName: "Guruh",
      flex: 1,
      valueGetter: (params) => getGroupName(params?.row),
    },
    {
      field: "amount",
      headerName: "To‘langan",
      flex: 0.7,
      valueFormatter: (params) =>
        Number(params?.value || 0).toLocaleString("uz-UZ"),
    },
    {
      field: "debt_amount",
      headerName: "Qarzdorlik",
      flex: 0.7,
      valueFormatter: (params) =>
        Number(params?.value || 0).toLocaleString("uz-UZ"),
    },
    { field: "month", headerName: "Oy", flex: 0.7 },
    {
      field: "status",
      headerName: "Holat",
      flex: 0.8,
      renderCell: (params) => {
        const val = params?.row?.status;
        const color =
          val === "paid" ? "success" : val === "partial" ? "warning" : "error";
        return (
          <Chip
            label={
              val === "paid"
                ? "To‘langan"
                : val === "partial"
                ? "Qisman"
                : "To‘lanmagan"
            }
            color={color}
            size="small"
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "Amal",
      flex: 1,
      renderCell: (params) => (
        <Button
          size="small"
          variant="contained"
          onClick={() => {
            setCurrentPayment(params.row);
            setPayAmount("");
            setOpenPay(true);
          }}
        >
          💵 To‘lov
        </Button>
      ),
    },
  ];

  // ------------------------------------------
  // UI
  // ------------------------------------------
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={600} mb={2}>
        💸 To‘lovlar boshqaruvi
      </Typography>

      {/* FILTRLAR */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Oy</InputLabel>
            <Select
              value={selectedMonth}
              label="Oy"
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <MenuItem value="">Barcha oylar</MenuItem>
              {uniqueMonths.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControlLabel
            control={
              <Switch
                checked={showDebtors}
                onChange={(e) => setShowDebtors(e.target.checked)}
              />
            }
            label="Faqat qarzdorlar"
          />
        </Grid>

        <Grid item xs={12} md={5} display="flex" justifyContent="end" gap={1}>
          <Button variant="outlined" onClick={handleGenerateDebts}>
            ⚙️ Qarzdorlik yaratish
          </Button>
          <Button variant="contained" onClick={() => setOpenAdd(true)}>
            ➕ To‘lov qo‘shish
          </Button>
        </Grid>
      </Grid>

      {/* STATISTIKA */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: "#e8fff3" }}>
            <CardContent>
              <Typography>💰 Jami to‘langan</Typography>
              <Typography variant="h6">
                {totalPaid.toLocaleString()} so‘m
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: "#fff6e6" }}>
            <CardContent>
              <Typography>⚠️ Qarzdorlik</Typography>
              <Typography variant="h6">
                {totalDebt.toLocaleString()} so‘m
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* JADVAL */}
      {loading ? (
        <Box textAlign="center" mt={3}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
          <DataGrid
            rows={filteredPayments}
            columns={columns}
            getRowId={(r) => r?.id ?? Math.random()}
            autoHeight
            pageSizeOptions={[5, 10, 20]}
            disableRowSelectionOnClick
            sx={{
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "#f9f9f9",
                fontWeight: 700,
              },
            }}
          />
        </Paper>
      )}

      {/* MODAL: Yangi to‘lov */}
      <Dialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>➕ Yangi to‘lov qo‘shish</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>O‘quvchi</InputLabel>
                <Select
                  value={addStudent}
                  label="O‘quvchi"
                  onChange={(e) => setAddStudent(e.target.value)}
                >
                  {students.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.full_name || s.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Guruh</InputLabel>
                <Select
                  value={addGroup}
                  label="Guruh"
                  onChange={(e) => setAddGroup(e.target.value)}
                >
                  {groups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Miqdor (so‘m)"
                size="small"
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Oy"
                size="small"
                type="month"
                value={addMonth}
                onChange={(e) => setAddMonth(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tavsif"
                size="small"
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Bekor qilish</Button>
          <Button
            variant="contained"
            onClick={handleAddPayment}
            disabled={saving}
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: To‘lovni yangilash */}
      <Dialog
        open={openPay}
        onClose={() => setOpenPay(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>💵 To‘lov qo‘shish</DialogTitle>
        <DialogContent>
          <Typography mb={2}>
            O‘quvchi: <b>{getStudentName(currentPayment)}</b> <br />
            Guruh: <b>{getGroupName(currentPayment)}</b>
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="To‘lov miqdori (so‘m)"
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPay(false)}>Bekor qilish</Button>
          <Button variant="contained" onClick={handleMarkPaid}>
            To‘lash
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payments;
