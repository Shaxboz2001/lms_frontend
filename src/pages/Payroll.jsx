import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Divider,
  Card,
  CardContent,
} from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../services/api";

export default function Payroll() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [rows, setRows] = useState([]);
  const [settings, setSettings] = useState({
    teacher_percent: "",
    manager_active_percent: "",
    manager_new_percent: "",
  });
  const [openSettings, setOpenSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  // 💰 Pay modal
  const [openPayModal, setOpenPayModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [paidAmount, setPaidAmount] = useState("");

  // 📊 Details modal
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);

  // 🕓 History modal
  const [openHistory, setOpenHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(month);

  // 📈 Summary
  const [summary, setSummary] = useState({
    totalEarned: 0,
    totalPaid: 0,
    totalPending: 0,
    totalTeachers: 0,
    totalManagers: 0,
  });

  // -----------------------------
  // Fetch payroll and settings
  // -----------------------------
  useEffect(() => {
    fetchRows();
    fetchSettings();
  }, [month]);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/payroll?month=${month}`);
      setRows(res.data);

      // 💡 Calculate summary
      let earned = 0,
        paid = 0,
        pending = 0,
        teachers = 0,
        managers = 0;

      res.data.forEach((r) => {
        earned += r.net || 0;
        if (r.status === "paid") paid += r.net || 0;
        if (r.status === "pending") pending += r.net || 0;
        if (r.role === "teacher") teachers++;
        if (r.role === "manager") managers++;
      });

      setSummary({
        totalEarned: earned,
        totalPaid: paid,
        totalPending: pending,
        totalTeachers: teachers,
        totalManagers: managers,
      });
    } catch {
      toast.error("Error fetching payroll data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/payroll/salary/settings");
      setSettings(res.data);
    } catch {
      toast.error("Error fetching salary settings");
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      await api.post(`/payroll/calculate?month=${month}`);
      toast.success("Payroll calculated successfully ✅");
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error calculating payroll");
    } finally {
      setLoading(false);
    }
  };

  const openPayDialog = (row) => {
    setSelectedPayroll(row);
    setPaidAmount(row.net || "");
    setOpenPayModal(true);
  };

  const handleConfirmPay = async () => {
    if (!paidAmount) return toast.error("Enter paid amount!");
    try {
      await api.post(`/payroll/${selectedPayroll.id}/pay`, {
        paid_amount: Number(paidAmount),
      });
      toast.success("Payment marked as paid 💰");
      setOpenPayModal(false);
      fetchRows();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error processing payment");
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api.put("/payroll/salary/settings", {
        teacher_percent: Number(settings.teacher_percent),
        manager_active_percent: Number(settings.manager_active_percent),
        manager_new_percent: Number(settings.manager_new_percent),
      });
      toast.success("Settings updated ✅");
      setOpenSettings(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save settings");
    }
  };

  const handleShowHistory = async () => {
    setOpenHistory(true);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/payroll?month=${selectedMonth}`);
      setHistoryData(res.data);
    } catch {
      toast.error("Error fetching payroll history");
    } finally {
      setHistoryLoading(false);
    }
  };

  // -----------------------------
  // UI Render
  // -----------------------------
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Toaster position="top-right" />
      <Typography variant="h5" fontWeight={600} mb={2}>
        Payroll Management
      </Typography>

      {/* SUMMARY SECTION */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "#f3f9ff" }}>
            <CardContent>
              <Typography variant="subtitle2" color="primary">
                💰 Total Earned
              </Typography>
              <Typography variant="h6">
                {summary.totalEarned.toLocaleString()} UZS
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "#e8fff3" }}>
            <CardContent>
              <Typography variant="subtitle2" color="green">
                ✅ Total Paid
              </Typography>
              <Typography variant="h6">
                {summary.totalPaid.toLocaleString()} UZS
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "#fff6e6" }}>
            <CardContent>
              <Typography variant="subtitle2" color="orange">
                ⏳ Pending
              </Typography>
              <Typography variant="h6">
                {summary.totalPending.toLocaleString()} UZS
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "#f5f5f5" }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                👩‍🏫 Teachers / 🧑‍💼 Managers
              </Typography>
              <Typography variant="h6">
                {summary.totalTeachers} / {summary.totalManagers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* SETTINGS & ACTIONS */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Month (YYYY-MM)"
              fullWidth
              size="small"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </Grid>
          <Grid item xs="auto">
            <Button
              variant="contained"
              onClick={handleCalculate}
              disabled={loading}
            >
              {loading ? <CircularProgress size={22} /> : "Calculate Payroll"}
            </Button>
          </Grid>
          <Grid item xs="auto">
            <Button variant="outlined" onClick={fetchRows}>
              Refresh
            </Button>
          </Grid>
          <Grid item xs="auto">
            <Button variant="outlined" onClick={() => setOpenSettings(true)}>
              Salary Settings ⚙️
            </Button>
          </Grid>
          <Grid item xs="auto">
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleShowHistory}
            >
              Show History 📅
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* TABLE */}
      <Paper sx={{ p: { xs: 1, md: 2 }, overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <b>Name</b>
              </TableCell>
              <TableCell>
                <b>Role</b>
              </TableCell>
              <TableCell>
                <b>Earned</b>
              </TableCell>
              <TableCell>
                <b>Deductions</b>
              </TableCell>
              <TableCell>
                <b>Net</b>
              </TableCell>
              <TableCell>
                <b>Status</b>
              </TableCell>
              <TableCell>
                <b>Paid At</b>
              </TableCell>
              <TableCell align="center">
                <b>Actions</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No payroll data available
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.user_name || r.user_id}</TableCell>
                <TableCell sx={{ textTransform: "capitalize" }}>
                  {r.role}
                </TableCell>
                <TableCell>{r.earned?.toLocaleString()}</TableCell>
                <TableCell>{r.deductions?.toLocaleString()}</TableCell>
                <TableCell>
                  <b>{r.net?.toLocaleString()}</b>
                </TableCell>
                <TableCell
                  sx={{
                    color: r.status === "paid" ? "green" : "orange",
                    fontWeight: 600,
                  }}
                >
                  {r.status}
                </TableCell>
                <TableCell>
                  {r.paid_at ? new Date(r.paid_at).toLocaleString() : "-"}
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedDetails(r.details);
                        setOpenDetails(true);
                      }}
                    >
                      View
                    </Button>
                    {r.status === "pending" ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => openPayDialog(r)}
                      >
                        Pay
                      </Button>
                    ) : (
                      <Button size="small" color="success" disabled>
                        Paid
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* DETAILS MODAL */}
      <Dialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        fullWidth
      >
        <DialogTitle>Payroll Details</DialogTitle>
        <DialogContent>
          {selectedDetails ? (
            <Box sx={{ mt: 1 }}>
              {Object.entries(selectedDetails).map(([key, val]) => (
                <Box
                  key={key}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #eee",
                    py: 0.8,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {key.replace(/_/g, " ")}
                  </Typography>
                  <Typography variant="body2">
                    {typeof val === "number"
                      ? val.toLocaleString()
                      : String(val)}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography>No details available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
